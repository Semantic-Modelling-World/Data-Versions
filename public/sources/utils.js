const UTILS = (global) => {
  const alpha = { value: 255 };
  global.alpha = alpha;

  class Vector {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }

    distance() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    plus(vector) {
      return Vec(this.x + vector.x, this.y + vector.y);
    }

    minus(vector) {
      return Vec(this.x - vector.x, this.y - vector.y);
    }

    multi(vector) {
      return Vec(this.x * vector.x, this.y * vector.y);
    }

    times(number) {
      return Vec(this.x * number, this.y * number);
    }

    normalized() {
      const distance = this.distance();
      return Vec(this.x / distance, this.y / distance);
    }

    orthogonal() {
      return Vec(this.y, -this.x);
    }

    dot(vector) {
      return this.x * vector.x + this.y * vector.y;
    }

    cross(vector) {
      return this.x * vector.y - this.y * vector.x;
    }

    side(vector) {
      return Math.sign(this.cross(vector));
    }

    angle(vector) {  // angle between two vectors
      const negative = this.side(vector) < 0 ? -1 : 1;
      return Math.acos(this.dot(vector) / this.distance() / vector.distance()) * negative;
    }
  }

  function Vec(x, y) {
    return new Vector(x, y);
  }
  global.Vec = Vec;

  class TwoD {
    static triangleArea(p1, p2, p3) {
      return Math.abs((p2.x * p1.y - p1.x * p2.y) + (p3.x * p2.y - p2.x * p3.y) + (p1.x * p3.y - p3.x * p1.y)) / 2;
    }

    static pointIntersectRect(point, p1, p2, p3, p4) {
      const rectArea = p1.minus(p2).distance() * p1.minus(p3).distance();
      const triArea = TwoD.triangleArea(p1, point, p4) + TwoD.triangleArea(p4, point, p3) + TwoD.triangleArea(p3, point, p2) + TwoD.triangleArea(point, p2, p1);
      return triArea <= rectArea;
    }
  }
  global.TwoD = TwoD;

  const COLORS = {
    "darkBlue": [0, 61, 112],
    "mediumBlue": [0, 142, 193],
    "lightBlue": [0, 157, 244],
    "darkGrey": [80, 88, 92],
    "mediumGrey": [95, 107, 113],
    "lightGrey": [142, 152, 157],
    "rdfGrey": [220, 220, 221],
    "darkOrange": [227, 106, 0],
    "mediumOrange": [243, 146, 0],
    "lightOrange": [255, 169, 39],
    "black": [30, 30, 30]
  };
  global.COLORS = COLORS;


  function ALPHA(color, a) {
    if (color.length < 3) {
      return color.concat([a]);
    }
    const newColor = [...color];
    newColor[3] = a;
    return newColor;
  }
  global.ALPHA = ALPHA;


  function UUID() {
    return crypto.randomUUID().slice(0, 8);
  }
  global.UUID = UUID;
}

export { UTILS };