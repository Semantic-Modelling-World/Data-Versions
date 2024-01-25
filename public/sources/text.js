const TEXT = (exp) => {
    const p5 = exp.p5;
    const view = exp.view;
    const ALPHA = exp.ALPHA;
    const COLORS = exp.COLORS;

    class Text {
        static textSize = 15;
        static ySpacing = 5;
        constructor(text, linebreak = true, textSize = Text.textSize, textColor = COLORS["black"]) {
            this.linebreak = linebreak;
            this.textSize = textSize;
            this.textColor = textColor;
            this.ySpacing = Text.ySpacing;
            this.edit = false;
            this.cursor = 0;
            this.cursorColor = COLORS["black"];
            this.cursorWidth = 2;
            this.time = Date.now();
            this.text = []
            this.selected = false;
            this.setText(text);
        }

        static getWidth(text) {
            p5.textSize(Text.textSize);
            p5.noStroke();
            return p5.textWidth(text);
        }

        copy() {
            const text = new Text();
            text.linebreak = this.linebreak;
            text.textSize = this.textSize;
            text.textColor = this.textColor;
            text.ySpacing = this.ySpacing;
            text.edit = false;
            text.cursor = this.cursor;
            text.cursorColor = this.cursorColor;
            text.cursorWidth = this.cursorWidth;
            text.text = this.text.slice();
            text.time = this.time;
            text.selected = false;
            return text;
        }

        getText() {
            return this.text.join('');
        }

        setText(text) {
            this.text = [];

            if (text !== undefined) {
                for (let i = 0; i < text.length; i++) {
                    this.insertChar(text[i]);
                }
            }
            this.setCursor(-1);
        }

        equals(text) {
            return this.getText() === text.getText();
        }

        setEdit(edit) {
            this.edit = edit;
        }

        cropCursor() {
            this.cursor = Math.min(this.text.length, Math.max(0, this.cursor));
        }

        setCursor(pos) {
            this.time = Date.now();
            if (pos >= 0) {
                this.cursor = pos;
            } else {
                this.cursor = this.text.length + pos + 1;
            }
            this.cropCursor();
        }

        moveCursor(n) {
            this.time = Date.now();
            const oldCursor = this.cursor;
            this.cursor += n;
            this.cropCursor();
            return oldCursor !== this.cursor;
        }

        findCursor(char, stride) {
            while (this.text[this.cursor] !== char && this.moveCursor(stride)) {
            }
            return this.text[this.cursor] === char;
        }

        findCursorRepeat(char, stride, repetitions) {
            for (let i = 0; i < repetitions; i++) {
                this.findCursor(char, stride);
                if (!this.moveCursor(stride)) {
                    return false;
                }
            }
            return true;
        }

        insertChar(char) {
            if (!this.linebreak && char === "\n") {
                return;
            }
            this.text.splice(this.cursor, 0, char);
            this.moveCursor(1);
        }

        deleteChar() {
            if (this.moveCursor(-1)) {
                this.text.splice(this.cursor, 1);
            }
        }

        lineEnd(index) {
            while (index < this.text.length && this.text[index] !== "\n") {
                index++;
            }
            return index;
        }

        getSize(x = 0, y = 0) {
            p5.noStroke();
            p5.textSize(this.textSize);
            if (!this.linebreak) {
                return { x: p5.textWidth(this.text.join('')), y: this.textSize, rows: 1 };
            }

            let maxWidth = 0;
            let index = 0;
            let counter = 0;
            while (index < this.text.length) {
                const end = this.lineEnd(index);
                const candidate = p5.textWidth(this.text.slice(index, end).join(''));
                if (candidate > maxWidth) {
                    maxWidth = candidate;
                }
                index = end + 1;
                counter++;
            }
            if (this.text[this.text.length - 1] === "\n") {
                counter++;
            }
            const height = counter * this.textSize + (counter - 1) * this.ySpacing;
            return { x: maxWidth + x, y: height + y, rows: counter };
        }

        draw(x, y, vertical = p5.LEFT, horizontal = p5.TOP) {
            p5.textAlign(vertical, horizontal);
            p5.noStroke();
            p5.textSize(this.textSize);
            p5.fill(ALPHA(this.textColor, view.alpha));
            if (this.selected) {
                p5.stroke(ALPHA(COLORS["lightGrey"], view.alpha));
            }

            let cursorX = x;
            let cursorY = y;
            let maxWidth = 0;
            let index = 0;
            let counter = 0;
            while (index <= this.text.length) {
                const end = this.lineEnd(index);
                const line = this.text.slice(index, end).join('');
                const candidate = p5.textWidth(line);
                if (candidate > maxWidth) {
                    maxWidth = candidate;
                }
                if (this.cursor - index >= 0 && this.cursor - end <= 0) {
                    cursorX = x + p5.textWidth(this.text.slice(index, this.cursor).join(''));
                    cursorY = y;
                }
                index = end + 1;
                counter++;
                p5.text(line, x, y);
                y += this.ySpacing + this.textSize;
            }
            if (this.edit && (Date.now() - this.time) % 1000 < 500) {
                p5.stroke(ALPHA(this.cursorColor, view.alpha));
                p5.strokeWeight(this.cursorWidth);
                p5.line(cursorX, cursorY, cursorX, cursorY + this.textSize);
            }
            const height = counter * this.textSize + (counter - 1) * this.ySpacing;
            return { x: maxWidth + x, y: height + y };
        }
    }
    exp.Text = Text;
}

export { TEXT };