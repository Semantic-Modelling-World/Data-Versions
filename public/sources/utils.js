const UTILS = (exp) => {
  const p5 = exp.p5;

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

    rotate(angle) {
      const x = this.x * Math.cos(angle) - this.y * Math.sin(angle);
      const y = this.x * Math.sin(angle) + this.y * Math.cos(angle);
      return Vec(x, y);
    }
  }

  function Vec(x, y) {
    return new Vector(x, y);
  }
  exp.Vec = Vec;

  class TwoD {
    static triangleArea(p1, p2, p3) {
      return Math.abs((p2.x * p1.y - p1.x * p2.y) + (p3.x * p2.y - p2.x * p3.y) + (p1.x * p3.y - p3.x * p1.y)) / 2;
    }

    static pointIntersectRect(point, p1, p2, p3, p4) {
      // Can be any rotated rectangle
      // The order of the points is important: top left, top right, down left, down right!
      const rectArea = p1.minus(p2).distance() * p1.minus(p3).distance();
      const triArea = TwoD.triangleArea(p1, point, p4) + TwoD.triangleArea(p4, point, p3) + TwoD.triangleArea(p3, point, p2) + TwoD.triangleArea(point, p2, p1);
      return triArea <= rectArea;
    }
  }
  exp.TwoD = TwoD;

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
  exp.COLORS = COLORS;

  // Transformations that should be applied to all nodes and edges
  // i.e. the zoom, the translation and the alpha color strength
  const view = { alpha: 255, viewpoint: Vec(0, 0), scale: 1 };
  exp.view = view;

  exp.applyView = (point, v) => {
    // for more advanced transformations use the Matrix library
    if (v === undefined) {
      v = view;
    }
    const center = Vec(p5.windowWidth / 2, p5.windowHeight / 2);
    const scaled = point.minus(center).times(1 / v.scale).plus(center);
    const translated = scaled.minus(v.viewpoint);
    return translated;
  }

  exp.unapplyView = (point, v) => {
    if (v === undefined) {
      v = view;
    }
    const center = Vec(p5.windowWidth / 2, p5.windowHeight / 2);
    const translated = point.plus(v.viewpoint);
    const scaled = translated.minus(center).times(v.scale).plus(center);
    return scaled;
  }

  function applyAlpha(color, alpha) {
    if (alpha === undefined) {
      alpha = view.alpha;
    }
    if (color.length < 4) {
      return color.concat([alpha]);
    }
    const newColor = [...color];
    newColor[3] = alpha;
    return newColor;
  }
  exp.applyAlpha = applyAlpha;


  function UUID() {
    return crypto.randomUUID().slice(0, 8);
  }
  exp.UUID = UUID;

  async function hash(string) {
    const encoded = new TextEncoder().encode(string);
    return crypto.subtle.digest('SHA-256', encoded).then((buffer) => {
      return Array.from(new Uint8Array(buffer)).map((bytes) => bytes.toString(16).padStart(2, '0')).join('');
    });
  }
  exp.hash = hash;
}