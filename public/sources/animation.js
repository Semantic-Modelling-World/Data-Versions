const ANIMATION = (exp) => {
    class Animation {
        static threshold = 0.999;
        static speed = 0.01;
        constructor(func, obj, callback) {
            this.time = Date.now();
            this.func = func;
            this.obj = obj;
            this.callback = callback;
            this.complete = false;
        }

        update() {
            if (this.complete) {
                return false;
            }
            const t = (Date.now() - this.time) * Animation.speed;
            const f = (1 - 1 / Math.pow(2, t));
            if (f < Animation.threshold) {
                this.func(f);
                return true;
            }
            return this.force();
        }

        force() {
            if (!this.complete) {
                this.complete = true;
                this.func(1);
                if (this.callback !== undefined) {
                    this.callback();
                }
            }
            return false;
        }
    }
    exp.Animation = Animation;

    class Animator {
        constructor() {
            this.clear();
        }

        clear() {
            this.animate = [];
        }

        update() {
            const animate = [];
            for (let i = 0; i < this.animate.length; i++) {
                this.animate[i].update();
            }
            for (let i = 0; i < this.animate.length; i++) {
                if (!this.animate.complete) {
                    animate.push(this.animate[i]);
                }
            }
            this.animate = animate;
        }

        cancel(obj) {
            const animate = [];
            for (let i = 0; i < this.animate.length; i++) {
                if (this.animate[i].obj == obj) {
                    this.animate[i].complete = true;
                    if (this.animate[i].callback !== undefined) {
                        this.animate[i].callback();
                    }
                }
            }
            for (let i = 0; i < this.animate.length; i++) {
                if (!this.animate.complete) {
                    animate.push(this.animate[i]);
                }
            }
            this.animate = animate;
        }

        force() {
            for (let i = 0; i < this.animate.length; i++) {
                this.animate[i].force();
            }
            this.animate = [];
        }
    }
    exp.animator = new Animator([]);
}

export { ANIMATION };