import tkinter

WIDTH = 15
HEIGHT = 15
GRID_W = 40
GRID_H = 40


class Wall(tkinter.Canvas):
    def __init__(self, weights, *args, **kwargs):
        tkinter.Canvas.__init__(self, *args, **kwargs)
        self.squares = []
        self.create_squares(weights)

    # Create Squares
    def create_squares(self, weights):
        for i in range(GRID_W):
            for j in range(GRID_H):
                x1 = i * WIDTH
                y1 = j * HEIGHT
                x2 = x1 + WIDTH
                y2 = y1 + HEIGHT
                s = self.create_rectangle(x1,
                                          y1,
                                          x2,
                                          y2,
                                          fill=self.color(
                                              weights[(i * GRID_W) + j]),
                                          tag="{}{}".format(i, j))
                self.squares.append(s)
        return

    def map(self, x, in_min, in_max, out_min, out_max):
        return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min

    # RGB Color Selecting Function
    def rgb(self, x, y, z):
        return "#%02x%02x%02x" % (x, y, z)

    def color(self, weights):

        a = weights[0]
        b = weights[1]
        c = weights[2]

        clamp = 1.25

        if a < -clamp:
            a = -clamp
        if b < -clamp:
            b = -clamp
        if c < -clamp:
            c = -clamp
        if a > clamp:
            a = clamp
        if b > clamp:
            b = clamp
        if c > clamp:
            c = clamp

        x = self.map(a, -clamp, clamp, 1, 255)
        y = self.map(b, -clamp, clamp, 1, 255)
        z = self.map(c, -clamp, clamp, 1, 255)

        return self.rgb(round(int(x)), round(int(y)), round(int(z)))
