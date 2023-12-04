const ANIMATION = (global) => {
  class Animation {
    static threshold = 0.999999;
    static speed = 0.01;
    constructor(func) {
      this.time = Date.now();
      this.func = func;
    }

    update() {
      const t = (Date.now() - this.time) * Animation.speed;
      const f = (1 - 1 / Math.pow(2, t));
      if (f < Animation.threshold) {
        this.func(f);
        return true;
      }
      this.func(1);
      return false;
    }

    force() {
      this.func(1);
    }
  }
  global.Animation = Animation;

}

export { ANIMATION };