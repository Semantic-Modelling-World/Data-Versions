const TEXT = (exp) => {
    const p5 = exp.p5;
    const view = exp.view;
    const applyView = exp.applyView;
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
            this.cursorX = 0;
            this.cursorY = 0;
            this.cursorColor = COLORS["black"];
            this.cursorWidth = 1;
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
            text.cursorX = this.cursorX;
            text.cursorY = this.cursorY;
            text.cursorColor = this.cursorColor;
            text.cursorWidth = this.cursorWidth;
            text.text = this.text.slice();
            text.time = this.time;
            text.selected = false;
            return text;
        }

        getText() {
            return this.text.map(row => row.join('')).join('\n');
        }

        setText(text) {
            this.text = [[]];
            if (text !== undefined) {
                for (let i = 0; i < text.length; i++) {
                    this.insertChar(text[i]);
                }
            }
        }

        equals(text) {
            return this.getText() === text.getText();
        }

        setEdit(edit) {
            this.time = Date.now();
            this.edit = edit;
        }

        cropCursor() {
            this.cursorY = Math.min(this.text.length - 1, Math.max(0, this.cursorY));
            this.cursorX = Math.min(this.text[this.cursorY].length, Math.max(0, this.cursorX));
        }

        setCursor(pos) {
            this.time = Date.now();
            if (pos >= 0) {
                this.cursorX = 0;
                this.cursorY = 0;
                this.moveCursor(pos);
            } else {
                this.cursorY = this.text.length - 1;
                this.cursorX = this.text[cursorY].length;
                this.moveCursor(pos + 1);
            }
        }

        move2DCursor(x, y) {
            this.time = Date.now();
            this.cursorX += x;
            this.cursorY += y;
            this.cropCursor();
        }

        moveCursor(n) {
            this.time = Date.now();
            if (n === 0) {
                return false;
            }
            for (let i = 0; i < n; i++) {
                const old = { x: this.cursorX, y: this.cursorY };
                this.cursorX++;
                if (this.cursorX > this.text[this.cursorY].length) {
                    this.cursorX = 0;
                    this.cursorY++;
                    if (this.cursorY >= this.text.length) {
                        this.cursorX = old.x;
                        this.cursorY = old.y;
                        return false;
                    }
                }
            }
            for (let i = 0; i < -n; i++) {
                const old = { x: this.cursorX, y: this.cursorY };
                this.cursorX--;
                if (this.cursorX < 0) {
                    this.cursorY--;
                    if (this.cursorY < 0) {
                        this.cursorX = old.x;
                        this.cursorY = old.y;
                        return false;
                    }
                    this.cursorX = this.text[this.cursorY].length;
                }
            }
            return true;
        }

        getChar() {
            if (this.cursorX < this.text[this.cursorY].length) {
                return this.text[this.cursorY][this.cursorX];
            }
            return "\n";
        }

        insertChar(char) {
            this.time = Date.now();
            if (char === "\n") {
                if (!this.linebreak) {
                    return false;
                }
                const row = this.text[this.cursorY];
                this.text.splice(this.cursorY, 1, row.slice(0, this.cursorX), row.slice(this.cursorX, row.length));
                this.cursorX = 0;
                this.cursorY++;
            } else {
                this.text[this.cursorY].splice(this.cursorX, 0, char);
                this.cursorX++;
            }
            return true;
        }

        deleteChar() {
            this.time = Date.now();
            if (this.cursorX === 0) {
                if (this.cursorY === 0) {
                    return false;
                }
                this.cursorY--;
                const row = this.text[this.cursorY];
                this.cursorX = row.length;
                row.concat(this.text[this.cursorY + 1]);
                this.text.splice(this.cursorY, 2, row);
            } else {
                this.cursorX--;
                this.text[this.cursorY].splice(this.cursorX, 1);
            }
            return true;
        }

        getSize(x = 0, y = 0) {
            p5.noStroke();
            p5.textSize(this.textSize);
            if (this.selected) {
                p5.stroke(ALPHA(COLORS["lightGrey"], view.alpha));
            }
            let maxWidth = 0;
            for (let i = 0; i < this.text.length; i++) {
                const row = this.text[i].join('');
                const width = p5.textWidth(row)
                if (width > maxWidth) {
                    maxWidth = width;
                }
            }
            const maxHeight = this.text.length * this.textSize + Math.max(0, this.text.length - 1) * this.ySpacing;
            return { x: maxWidth + x, y: maxHeight + y};
        }

        draw(x, y, vertical = p5.LEFT, horizontal = p5.TOP) {
            p5.noStroke();
            p5.textSize(this.textSize);
            p5.textAlign(vertical, horizontal);
            p5.fill(ALPHA(this.textColor, view.alpha));
            if (this.selected) {
                p5.stroke(ALPHA(COLORS["lightGrey"], view.alpha));
            }
            let maxWidth = 0;
            for (let i = 0; i < this.text.length; i++) {
                const row = this.text[i].join('');
                const width = p5.textWidth(row)
                if (width > maxWidth) {
                    maxWidth = width;
                }
                p5.text(row, x, y + (this.textSize + this.ySpacing) * i);
            }
            if (this.edit && (Date.now() - this.time) % 1000 < 500) {
                const cursorY = y + (this.textSize + this.ySpacing) * this.cursorY;
                const row = this.text[this.cursorY].slice(0, this.cursorX).join('');
                const cursorX = x + p5.textWidth(row);
                p5.stroke(ALPHA(this.cursorColor, view.alpha));
                p5.strokeWeight(this.cursorWidth);
                p5.line(cursorX, cursorY, cursorX, cursorY + this.textSize);
            }
            const maxHeight = this.text.length * this.textSize + (this.text.length - 1) * this.ySpacing;
            return { x: maxWidth + x, y: maxHeight + y};
        }

        setCursorByPoint(x, y, point) {
            this.time = Date.now();
            point = applyView(point);
            p5.noStroke();
            p5.textSize(this.textSize);
            if (this.selected) {
                p5.stroke(ALPHA(COLORS["lightGrey"], view.alpha));
            }
            if (point.y <= y) {
                this.cursorY = 0;
            } else if (point.y >= y + (this.textSize + this.ySpacing) * this.text.length) {
                this.cursorY = this.text.length - 1;
            } else {
                for (let i = 0; i < this.text.length; i++) {
                    const start = y + (this.textSize + this.ySpacing) * i - this.ySpacing / 2;
                    const end = start + this.textSize + this.ySpacing / 2;
                    if (start <= point.y && end >= point.y) {
                        this.cursorY = i;
                        break;
                    }
                }
            }

            const row = this.text[this.cursorY];
            if (point.x <= x + p5.textWidth(row.slice(0, 1).join('')) / 2) {
                this.cursorX = 0;
            } else if (point.x >= x + (p5.textWidth(row.join('')) + p5.textWidth(row.slice(0, row.length - 1).join(''))) / 2) {
                this.cursorX = row.length;
            } else {
                let left = x;
                let mid = x + p5.textWidth(row.slice(0, 1).join(''));
                let right = x + p5.textWidth(row.slice(0, 2).join(''));
                for (let j = 1; j < row.length; j++) {
                    const start = (left + mid) / 2;
                    const end = (mid + right) / 2;
                    console.log(start, end, point.x, j , row.length, x)
                    if (start <= point.x && end >= point.x) {
                        this.cursorX = j;
                        break;
                    }
                    left = mid;
                    mid = right;
                    right = x + p5.textWidth(row.slice(0, j + 2).join(''));
                }
            }
        }
    }
    exp.Text = Text;
}

export { TEXT };