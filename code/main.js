"use strict";

let gl; let vertices; let normalsArray; let colorsArray; let faces; let canvas;
let vertBuffer; let normalBuffer; let colorBuffer;

let x_min = -10; let x_max = 10; let z_min = -20; let z_max = 0;
let width = (x_max - x_min) / 4; let height = (z_max - z_min) / 4;
let step = 1 / 10;

// Frustum parameters with constraints 
let left = -2; // [-3,-1]
let right = 2; // [1,3]
let near = 2; // [1,3]
let far = 14; // [14,18]
let top1 = 2; // [1,2]
let bottom = -2; // [-2,-1]
let speed = 0.01; // [0,0.07]

// Parameter for scene updates
let updated = false;

// Matrices that are passed to the GPU
var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var nMatrix, nMatrixLoc;


let eye = vec3(0.0, 3.0, 0.0);
let at = vec3(0.0, 3.0, -1.0);
let up = vec3(0.0, 1.0, 0.0);
let dir = normalize(subtract(at, eye), false);

// Defines rotation increment/speed
let deltaTheta = 1;

// All angles contrained to [-90,90]
let pitchAngle = 0; let rollAngle = 0; let yawAngle = 0;

// count keeps track of toggling of view
// flatsmoothphong keeps track of toggling of shading
var count = 3; var flatsmoothphong = 1;
var countArray = ['Points View', "Wireframe View", "Face View"]
var shadingArray = ['Flat Shading', "Smooth Shading", "Phong Shading"]


window.onload = function init() {

  canvas = document.getElementById("gl-canvas");
  gl = canvas.getContext('webgl2');
  if (!gl) alert("WebGL 2.0 isn't available");

  //  Configure WebGL
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(135 / 255, 206 / 255, 235 / 255, 1.0);

  //  Load shaders and initialize attribute buffers
  let program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // Compute data.
  faces = get_faces(x_min, x_max, z_min, z_max);
  vertices = get_faces(x_min, x_max, z_min, z_max);
  normalsArray = findNormal(vertices, flatsmoothphong);
  colorsArray = setColor(vertices, flatsmoothphong);

  modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
  projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");
  nMatrixLoc = gl.getUniformLocation(program, "uNormalMatrix");

  vertBuffer = gl.createBuffer();
  normalBuffer = gl.createBuffer();
  colorBuffer = gl.createBuffer();

  // Loading the data into the GPU (vertex buffer, colorbuffer and normalbuffer) 
  // and binding to shader variables.
  gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.DYNAMIC_DRAW);

  let vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.DYNAMIC_DRAW);

  let vNormal = gl.getAttribLocation(program, "aNormal");
  gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.DYNAMIC_DRAW);

  let vColor = gl.getAttribLocation(program, "aColor");
  gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  // Initialize HTML elements to frustum parameters
  document.getElementById("left-value").innerHTML = `Left = ${left}`;
  document.getElementById("right-value").innerHTML = `Right = ${right}`;
  document.getElementById("top-value").innerHTML = `Top = ${top1}`;
  document.getElementById("bottom-value").innerHTML = `Bottom = ${bottom}`;
  document.getElementById("near-value").innerHTML = `Near = ${near}`;
  document.getElementById("far-value").innerHTML = `Far = ${far}`;

  //handles key events
  document.addEventListener('keydown', (event) => {
    HandleKeyControls(event);
  });

  gl.uniform1f(gl.getUniformLocation(program, "flatsmoothphong"), flatsmoothphong)
  render();
  updateScene();
}


async function updateScene() {
  /*
  Update scene depending on current position. 
  Camera cannot move back, so only left, right, up, need to be checked.
  If going to go out of view, get a new patch, and bind all new vertices, colors, normals to buffers.
  */
  if (eye[0] <= x_min + width) {
    x_max -= width;
    x_min -= width;
    binding(x_min, x_max, z_min, z_max, vertices, normalsArray, colorsArray, flatsmoothphong);
  }
  if (eye[0] >= x_max - width) {
    x_max += width;
    x_min += width;
    binding(x_min, x_max, z_min, z_max, vertices, normalsArray, colorsArray, flatsmoothphong);
  }
  if (eye[2] <= z_max - height) {
    z_max -= height;
    z_min -= height;
    vertices = get_patch(x_min, x_max, z_min, z_max);
    binding(x_min, x_max, z_min, z_max, vertices, normalsArray, colorsArray, flatsmoothphong);
  }
}


// mat4 * vec4(vec3,0)
function mymult(m, v) {
  var res = vec3();
  for (let i = 0; i < 3; i++) {
    res[i] = 0.0;
    for (let j = 0; j < 3; j++)
      res[i] += m[i][j] * v[j];
    //res[i] += m[i][3];
  }
  return res;
}

function render() {
  /*
  The function which allows animation through requestAnimationFrame at the end.
  If we press 'c' or 'v' we get a new patch.
  We calculate the new camera vectors in every loop.
  We calculate the model view and projection matrix to pass to the GPU.
  We draw the scene each loop.
  */

  updateScene();

  if (updated == true) {
    binding(x_min, x_max, z_min, z_max, vertices, normalsArray, colorsArray, flatsmoothphong);
    updated = false;
  }

  // Projection and MVMatrix 
  dir = normalize(subtract(at, eye), false);
  eye = add(eye, scale(speed, dir));
  at = add(eye, dir);


  // ROLL rotation
  var rollRot = rotate(rollAngle, dir);

  // YAW rotation
  var yawRot = rotate(yawAngle, up);

  // PITCH rotation
  var right_vector = normalize(cross(dir, up), false);
  var pitchRot = rotate(pitchAngle, right_vector);

  modelViewMatrix = mult(pitchRot, (mult(yawRot, mult(rollRot, lookAt(eye, at, up)))));
  projectionMatrix = frustum(left, right, bottom, top1, near, far);

  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
  gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
  nMatrix = normalMatrix(modelViewMatrix, true);
  gl.uniformMatrix3fv(nMatrixLoc, false, flatten(nMatrix));

  gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT);


  // draws view desired by user toggling
  if (count == 1) {
    gl.drawArrays(gl.POINTS, 0, vertices.length);
  }
  else if (count == 2) {
    gl.drawArrays(gl.LINES, 0, vertices.length);
  }
  else if (count == 3) {
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
  }
  requestAnimationFrame(render);
}

function get_faces(x_min, x_max, z_min, z_max) {
  /*
  To get a face, we need 3 vertices. We do this twice for a square which is comprised of 2 triangles.
  This is also equivalent to the faces mode, and it is what we need to do to calculate normals.
  */
  let verts = []
  for (let z = z_min; z < z_max; z += step) {
    for (let x = x_min; x < x_max; x += step) {
      let y1 = Math.max(getHeight(x, z), 0);
      let y2 = Math.max(getHeight(x + step, z), 0);
      let y3 = Math.max(getHeight(x, z + step), 0);
      let y4 = Math.max(getHeight(x + step, z + step), 0);

      verts.push(vec3(x, y1, z));
      verts.push(vec3(x + step, y2, z));
      verts.push(vec3(x, y3, z + step));

      verts.push(vec3(x + step, y4, z + step));
      verts.push(vec3(x, y3, z + step));
      verts.push(vec3(x + step, y2, z));
    }
  }
  return verts;
}

function get_patch(x_min, x_max, z_min, z_max) {
  /*
  Based on the mode such as points, wireframe or faces, we need to generate the vertices 
  in a different order. This order is determined by the order in which webgl draws the arrays.
  */
  let verts = [];

  if (count == 1) {
    for (let z = z_min; z < z_max; z += step) {
      for (let x = x_min; x < x_max; x += step) {
        let y = Math.max(getHeight(x, z), 0);
        verts.push(vec3(x, y, z));
      }
    }
  }
  else if (count == 2) {
    for (let z = z_min; z < z_max; z += step) {
      for (let x = x_min; x < x_max; x += step) {
        let y1 = Math.max(getHeight(x, z), 0);
        let y2 = Math.max(getHeight(x + step, z), 0);
        let y3 = Math.max(getHeight(x, z + step), 0);
        let y4 = Math.max(getHeight(x + step, z + step), 0);

        verts.push(vec3(x, y1, z));
        verts.push(vec3(x + step, y2, z));

        verts.push(vec3(x + step, y2, z));
        verts.push(vec3(x, y3, z + step));

        verts.push(vec3(x, y3, z + step));
        verts.push(vec3(x, y1, z));
      }
    }
  }
  else if (count == 3) {
    verts = get_faces(x_min, x_max, z_min, z_max);
  }
  return verts;
}

// function to handle key controls
function HandleKeyControls(event) {
  let keysPressed = {};
  keysPressed[event.key] = true;
  var name = event.key;
  // toggles between different views
  if (name == 'V' || name == 'v') {
    if (count == 3) {
      count = 1;
    }
    else {
      count++;
    }
    document.getElementById("view").innerHTML = countArray[count - 1];
    updated = true;
  }
  // toggles between different shadings
  else if (name == 'C' || name == 'c') {
    if (flatsmoothphong == 3) {
      flatsmoothphong = 1;
    }
    else {
      flatsmoothphong++;
    }
    document.getElementById("shade").innerHTML = shadingArray[flatsmoothphong - 1];
    updated = true;
  }
  // alters the bounds of view within constraints 
  else if (name == '1') {
    if (left <= -3) {
      return;
    }
    left -= 1;
    document.getElementById("left-value").innerHTML = `Left = ${left}`;
  }
  else if (name == '!') {
    if (left >= -1) {
      return;
    }
    left += 1;
    document.getElementById("left-value").innerHTML = `Left = ${left}`;
  }
  else if (name == '2') {
    if (right <= 1) {
      return;
    }
    right -= 1;
    document.getElementById("right-value").innerHTML = `Right = ${right}`;
  }
  else if (name == '@') {
    if (right >= 3) {
      return;
    }
    right += 1;
    document.getElementById("right-value").innerHTML = `Right = ${right}`;
  }
  else if (name == '3') {
    if (top1 <= 1) {
      return;
    }
    top1 -= 1;
    document.getElementById("top-value").innerHTML = `Top = ${top1}`;
  }
  else if (name == '#') {
    if (top1 >= 2) {
      return;
    }
    top1 += 1;
    document.getElementById("top-value").innerHTML = `Top = ${top1}`;
  }
  else if (name == '4') {
    if (bottom <= -2) {
      return;
    }
    bottom -= 1;
    document.getElementById("bottom-value").innerHTML = `Bottom = ${bottom}`;
  }
  else if (name == '$') {
    if (bottom >= -1) {
      return;
    }
    bottom += 1;
    document.getElementById("bottom-value").innerHTML = `Bottom = ${bottom}`;
  }
  else if (name == '5') {
    if (near <= 1) {
      return;
    }
    near -= 1;
    document.getElementById("near-value").innerHTML = `Near = ${near}`;
  }
  else if (name == '%') {
    if (near >= 3) {
      return;
    }
    near += 1;
    document.getElementById("near-value").innerHTML = `Near = ${near}`;
  }
  else if (name == '6') {
    if (far >= 18) {
      return;
    }
    far += 1;
    document.getElementById("far-value").innerHTML = `Far = ${far}`;
  }
  else if (name == '^') {
    if (far <= 14) {
      return;
    }
    far -= 1;
    document.getElementById("far-value").innerHTML = `Far = ${far}`;
  }
  else if (name == "ArrowUp") {
    if (speed >= 0.07) {
      return;
    }
    else {
      speed += 0.01 / 10;
    }
  }
  else if (name == "ArrowDown") {
    if (speed <= 0.000) {
      return;
    }
    else {
      speed -= 0.01 / 10;
    }
  }
  else if (name == "W" || name == "w") {
    if (pitchAngle <= -90) {
      return;
    }
    else {
      pitchAngle -= deltaTheta;
    }
  }
  else if (name == "S" || name == "s") {
    if (pitchAngle >= 90) {
      return;
    }
    else {
      pitchAngle += deltaTheta;
    }
  }
  else if (name == "A" || name == "a") {
    if (yawAngle >= 90) {
      return;
    }
    else {
      yawAngle += deltaTheta;
    }
  }
  else if (name == "D" || name == "d") {
    if (yawAngle <= -90) {
      return;
    }
    else {
      yawAngle -= deltaTheta;
    }
  }
  else if (name == "Q" || name == "q") {
    if (rollAngle <= -90) {
      return;
    }
    else {
      rollAngle -= deltaTheta;
    }
  }
  else if (name == "E" || name == "e") {
    if (rollAngle >= 90) {
      return;
    }
    else {
      rollAngle += deltaTheta;
    }

  }
  // Quitting
  else if (event.keyCode == 27) {
    alert("Quitting!")
    close();
  }
}

function binding(x_min, x_max, z_min, z_max, vertices, normalsArray, colorsArray, flatsmoothphong) {
  /*
  this function is just used to bind the variables to the buffers when generating a new patch.
  */

  vertices = get_patch(x_min, x_max, z_min, z_max);
  normalsArray = findNormal(vertices, flatsmoothphong);
  colorsArray = setColor(vertices, flatsmoothphong);
  faces = get_faces(x_min, x_max, z_min, z_max);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

}