const ANIMATION = (global) => {
    class Animation {
        static threshold = 0.999999;
        static speed = 0.01;
        constructor(func, obj) {
            this.time = Date.now();
            this.func = func;
            this.obj = obj;
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

    class Animator {
        constructor() {
            this.clear();
        }

        clear() {
            this.animate = [];
        }

        update() {
            const animate = [];
            this.animate.forEach(ani => {
                if (ani.update()) {
                    animate.push(ani);
                }
            });
            this.animate = animate;
        }

        cancel(obj) {
            const animate = [];
            this.animate.forEach(ani => {
                if (ani.obj !== obj) {
                    animate.push(ani);
                }
            });
            this.animate = animate;
        }

        force() {
            this.animate.forEach(ani => {
                ani.force();
            });
        }
    }
    global.animator = new Animator([]);
}

export { ANIMATION };