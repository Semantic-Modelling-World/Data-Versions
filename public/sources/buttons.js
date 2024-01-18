const BUTTONS = (exp) => {
    const p5 = exp.p5;
    const Vec = exp.Vec;

    class CircleButton {
        constructor(img, size, rotation, radius) {
            this.img = img;
            this.size = Vec(img.width * size, img.height * size);
            this.radius = radius;
            this.rotation = rotation;
        }

        draw(pos) {
            p5.push();
            p5.translate(pos.plus(this.size.times(0.5)));
            p5.rotate(this.rotation);
            p5.image(this.img, pos.x, pos.y, this.size.x, this.size.y);
            p5.pop();
        }

        touches(pos, mouse) {
            return mouse.minus(pos.plus(this.size.times(1 / 2))).distance() <= this.radius;
        }
    }
    exp.CircleButton = CircleButton;

    class SquareButton {
        constructor(img, size, rotation) {
            this.img = img;
            this.size = Vec(img.width * size, img.height * size);
            this.rotation = rotation;
        }

        draw(pos) {
            p5.push();
            const mid = pos.plus(this.size.times(0.5));
            p5.translate(mid.x, mid.y);
            p5.rotate(this.rotation);
            p5.translate(-this.size.x * 0.5, -this.size.y * 0.5);
            p5.image(this.img, 0, 0, this.size.x, this.size.y);
            p5.pop();
        }

        touches(pos, mouse) {
            return mouse.x >= pos.x && mouse.y >= pos.y && mouse.x <= pos.x + this.size.x && mouse.y <= pos.y + this.size.y;
        }
    }
    exp.SquareButton = SquareButton;
}

export { BUTTONS };