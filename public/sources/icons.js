const ICONS = (global) => {
    const p5 = global.p5;
    const Vec = global.Vec;

    class ResetIcon {
        constructor(img, vec, size, radius) {
            this.img = img;
            this.vec = vec;
            this.size = Vec(img.width * size, img.height * size);
            this.radius = radius;
        }

        draw() {
            p5.image(this.img, this.vec.x, this.vec.y, this.size.x, this.size.y);
            const mouse = Vec(p5.mouseX, p5.mouseY);
            if (this.touches(mouse)) {
                p5.noStroke();
                p5.fill(0, 0, 0, 10);
                p5.ellipse(this.vec.x + this.size.x / 2, this.vec.y + this.size.y / 2, this.radius * 2, this.radius * 2);
            }
        }

        touches(pos) {
            return pos.minus(this.vec.plus(this.size.times(1 / 2))).distance() <= this.radius;
        }
    }
    global.ResetIcon = ResetIcon;


    class HelpIcon {
        constructor(img, vec, size, radius, versioning) {
            this.img = img;
            this.vec = vec;
            this.size = Vec(img.width * size, img.height * size);
            this.radius = radius;
            this.versioning = versioning;
        }

        draw() {
            const x = p5.windowWidth - this.vec.x - this.size.x;
            const y = this.vec.y;
            p5.image(this.img, x, y, this.size.x, this.size.y);
            const mouse = Vec(p5.mouseX, p5.mouseY);
            if (this.touches(mouse)) {
                p5.noStroke();
                p5.fill(0, 0, 0, 10);
                p5.ellipse(x + this.size.x / 2, y + this.size.y / 2, this.radius * 2, this.radius * 2);
            }
        }

        touches(pos) {
            const vec = Vec(p5.windowWidth - this.vec.x - this.size.x, this.vec.y);
            return pos.minus(vec.plus(this.size.times(1 / 2))).distance() <= this.radius;
        }
    }
    global.HelpIcon = HelpIcon;

}

export { ICONS };