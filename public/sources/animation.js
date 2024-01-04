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
        constructor(animate) {
            this.animate = animate;
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

        cancel(node) {
            const animate = [];
            this.animate.forEach(ani => {
                if (ani.obj !== node) {
                    animate.push(ani);
                }
            });
            this.animate = animate;
        }

        force() {
            this.animate.forEach(ani => {
                ani.force();
            });
            if (this.animateRDF !== undefined) {
                this.animateRDF.force();
                this.animateRDF = undefined;
            }
        }
    }
    global.Animator = Animator;

}

export { ANIMATION };