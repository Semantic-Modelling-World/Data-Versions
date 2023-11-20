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
                p5.fill(0, 0, 0, 10);
                p5.ellipse(this.vec.x + this.size.x / 2, this.vec.y + this.size.y / 2, this.radius * 2, this.radius * 2);
            }
        }

        touches(pos) {
            return pos.minus(this.vec.plus(this.size.times(1 / 2))).distance() <= this.radius;
        }
    }
    global.ResetIcon = ResetIcon;


    class EditIcon {
        constructor(img, vec, size, radius, versioning) {
            this.img = img;
            this.vec = vec;
            this.size = Vec(img.width * size, img.height * size);
            this.radius = radius;
            this.versioning = versioning;
        }

        draw() {
            const x = p5.windowWidth - this.versioning.rdfWidth - this.vec.x - this.size.x;
            const y = p5.windowHeight - this.vec.y - this.size.y + 5;
            p5.image(this.img, x, y, this.size.x, this.size.y);
        }
    }
    global.EditIcon = EditIcon;


    class HelpIcon {
        constructor(img, vec, size, radius, versioning) {
            this.img = img;
            this.vec = vec;
            this.size = Vec(img.width * size, img.height * size);
            this.radius = radius;
            this.versioning = versioning;
        }

        draw() {
            const x = p5.windowWidth - this.versioning.rdfWidth - this.vec.x - this.size.x;
            const y = this.vec.y;
            p5.image(this.img, x, y, this.size.x, this.size.y);
            const mouse = Vec(p5.mouseX, p5.mouseY);
            if (this.touches(mouse)) {
                p5.fill(0, 0, 0, 10);
                p5.ellipse(x + this.size.x / 2, y + this.size.y / 2, this.radius * 2, this.radius * 2);
            }
        }

        touches(pos) {
            const vec = Vec(p5.windowWidth - this.versioning.rdfWidth - this.vec.x - this.size.x, this.vec.y);
            return pos.minus(vec.plus(this.size.times(1 / 2))).distance() <= this.radius;
        }
    }
    global.HelpIcon = HelpIcon;


    class GlassIcon {
        constructor(unchecked, checked, vec, size, radius, versioning) {
            this.unchecked = unchecked;
            this.checked = checked;
            this.vec = vec;
            this.size = Vec(unchecked.width * size, unchecked.height * size);
            this.radius = radius;
            this.versioning = versioning;
        }

        draw() {
            const x = p5.windowWidth - this.vec.x - this.size.x;
            const y = p5.windowHeight - this.vec.y - this.size.y;
            if (this.versioning.rdfDetail) {
                p5.image(this.checked, x, y, this.size.x, this.size.y);
            } else {
                p5.image(this.unchecked, x, y, this.size.x, this.size.y);
            }
            const mouse = Vec(p5.mouseX, p5.mouseY);
            if (this.touches(mouse)) {
                p5.fill(0, 0, 0, 10);
                p5.ellipse(x + this.size.x / 2.5, y + this.size.y / 2.4, this.radius * 1.7, this.radius * 1.7);
            }
        }

        touches(pos) {
            const startX = p5.windowWidth - this.vec.x - this.size.x;
            const startY = p5.windowHeight - this.vec.y - this.size.y;
            return pos.x >= startX && pos.y >= startY && pos.x <= startX + this.size.x && pos.y <= startY + this.size.y;
        }
    }
    global.GlassIcon = GlassIcon;
}

export { ICONS };