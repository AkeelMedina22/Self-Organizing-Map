function map_point(p, q, a, b, x) {
    // If we are mapping from a number range to a number range: 

    if (typeof (p) == 'number' && typeof (a) == 'number') {
        return (a + (parseFloat(b - a) / parseFloat((q - p)) * (x - p)))
    }

    // If we are mapping from a vector range to a vector range:
    var vector = subtract(q, p);
    var alphavect = subtract(p, x);
    var alpha = length(alphavect) / length(vector);

    return mix(a, b, alpha);
}

function frustum(left, right, bottom, top, near, far) {

    if (left == right) { throw "frustum(): left and right are equal"; }

    if (bottom == top) { throw "frustum(): bottom and top are equal"; }

    if (near == far) { throw "frustum(): near and far are equal"; }

    let w = right - left;

    let h = top - bottom;

    let d = far - near;

    let result = mat4();

    result[0][0] = 2.0 * near / w;

    result[1][1] = 2.0 * near / h;

    result[2][2] = -(far + near) / d;

    result[0][2] = (right + left) / w;

    result[1][2] = (top + bottom) / h;

    result[2][3] = -2 * far * near / d;

    result[3][2] = -1;

    result[3][3] = 0.0;

    return result;

}
 
function average(lst){
  /*
  function to take average of any number of 
  vectors passed in it's list argument
  */

  var res = vec3(0.0,0.0,0.0);
  for (var i = 0; i < lst.length; i+=1){
    res = add(res,lst[i])
  }
  return mult(res, vec3(1/lst.length,1/lst.length,1/lst.length))
}

function getHeight(x, z) {
    return noise.perlin2(x, z)
  }


function setColor(vertices,flatsmoothphong)
{
  /*
  finds out normals of triangle vertex and appends to 
  normals list according to type of shading required 
  */
  let colors = [];

  for (let i = 0; i < vertices.length; i+=3)
  {
    let c = [];
    // mapping from altitude to color
    for (let x = i; x < i+3; x+=1){
      let r=0.0, g=0.0, b=0.0;
      // Terrain below ground level is covered by water
      if (vertices[x][1] <= 0)
      {
        b = map_point(-1, 0, 0, 0.5, vertices[x][1]);
      }
      // Terrain above ground level is mountaineous
      else if (vertices[x][1] > 0 && vertices[x][1] <= 0.1)
      {
        r = 0.588;
        g = 0.294;
      }
      // Green 
      else if (vertices[x][1] > 0.1 && vertices[x][1] <= 0.3)
      {
        g = 0.44;
      }
      // White
      else if (vertices[x][1] > 0.3 && vertices[x][1] <= 0.5)
      {
        r = map_point(0.3, 0.5, 0.7, 1, vertices[x][1]);
        g = map_point(0.3, 0.5, 0.7, 1, vertices[x][1]);
        b = map_point(0.3, 0.5, 0.7, 1, vertices[x][1]);
      }
      else
      {
        r = 1.0;
        g = 1.0;
        b = 1.0;
      }
      // contains color of vertices of triangle
      c.push(vec3(r,g,b))
    }
      
    // if flat shading
    // take average colors of triangle
    if (flatsmoothphong == 1){
      var avg = average([c[0],c[1],c[2]]);
      colors.push(avg);
      colors.push(avg);
      colors.push(avg);
    }
    else{
      colors.push(c[0],c[1],c[2]);
    }
  }
  return colors;
}

function findNormal(vertices,flatsmoothphong)
{
  /*
  finds out normals of triangle vertex and appends to 
  normals list according to type of shading required 
  */
  var normals = [];
  var faceNormals = [];

  // flat shading
  if (flatsmoothphong == 1){
    for (let i = 0; i < vertices.length; i+=3){
      var a = vertices[i];
      var b = vertices[i+ 1];
      var c = vertices[i + 2];
      // getting face vectors
      var t1 = subtract(b,a);
      var t2 = subtract(c,b);
      // normalizing and taking cross product 
      // to get perpendicular vector
      var normal = normalize(cross(t1, t2));
      //normals of faces
      normals.push(normal);
    }
  }
  // smooth shading
  else if(flatsmoothphong == 2){
    var dict = {};
    for (let i = 0; i < vertices.length; i+=3){
      var a = vertices[i];
      var b = vertices[i+ 1];
      var c = vertices[i + 2];
      var t1 = subtract(b,a);
      var t2 = subtract(c,b);
      var normal = normalize(cross(t1, t2));
      
      // dictionary with each vertex as key 
      // and normals of faces surrounding it
      if (vertices[i] in dict){
        dict[vertices[i]].push(normal);
      }
      else{
        dict[vertices[i]] = []
      }
      if (vertices[i+1] in dict){
        dict[vertices[i+1]].push(normal);
      }
      else{
        dict[vertices[i+1]] = []
      }
      if (vertices[i+2] in dict){
        dict[vertices[i+2]].push(normal);
      }
      else{
        dict[vertices[i+2]] = []
      }
    }
      // face normals surrounding each vertex 
      // have been averaged and pushed into normals array 
      // which is passes to shaders
    for (let i = 0; i < vertices.length; i+=1){
      normals.push(average(dict[vertices[i]]))
    }

  }
  // phong shading
  else if(flatsmoothphong == 3){
    var dict = {};
    for (let i = 0; i < vertices.length; i+=3){
      var a = vertices[i];
      var b = vertices[i+ 1];
      var c = vertices[i + 2];
      var t1 = subtract(b,a);
      var t2 = subtract(c,b);
      var normal = normalize(cross(t1, t2));
      
      // dictionary with each vertex as key 
      // and normals of faces surrounding it
      if (vertices[i] in dict){
        dict[vertices[i]].push(normal);
      }
      else{
        dict[vertices[i]] = []
      }
      if (vertices[i+1] in dict){
        dict[vertices[i+1]].push(normal);
      }
      else{
        dict[vertices[i+1]] = []
      }
      if (vertices[i+2] in dict){
        dict[vertices[i+2]].push(normal);
      }
      else{
        dict[vertices[i+2]] = []
      }
    }
      // face normals surrounding each vertex 
      // have been averaged and pushed into normals array 
      // which is passes to shaders
    for (let i = 0; i < vertices.length; i+=1){
      normals.push(average(dict[vertices[i]]))
    }
  }
  return normals
}
   
