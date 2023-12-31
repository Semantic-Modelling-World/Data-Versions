const GRAPH = (global) => {
    const p5 = global.p5;
    const Vec = global.Vec;
    const TwoD = global.TwoD;
    const COLORS = global.COLORS;
    const ALPHA = global.ALPHA;
    const view = global.view;
    const applyView = global.applyView;
    const Text = global.Text;

    // TODO: Handle bidirectional...

    class Id {
        constructor(predecessor, id) {
            this.id = id;
            this.successors = [];
            this.addPredecessor(predecessor);
        }

        addPredecessor(predecessor) {
            this.predecessor = predecessor;
            if (predecessor !== undefined) {
                predecessor.successors.push(this);
            }
        }
    }

    class Node extends Id {
        static textPadding = Vec(15, 16);
        static minWidth = 70;
        static minHeight = (Text.textSize * 2 + Text.ySpacing + Node.textPadding.y * 2) / 2;
        static rounding = 10;
        static strokeWeight = 3;

        constructor(predecessor, id, text, pos, immutable = false, minWidth = Node.minWidth, minHeight = Node.minHeight) {
            super(predecessor, id);
            this.text = new Text(text);
            this.width = 0;  // half width
            this.height = 0;
            this.minWidth = minWidth;
            this.minHeight = minHeight;
            this.pos = pos;
            this.selected = false;
            this.visible = true;
            this.immutable = immutable;
            this.resize();
        }

        copy() {
            const node = new Node();
            node.predecessor = this.predecessor;
            node.id = this.id;
            node.text = this.text.copy();
            node.width = this.width;
            node.height = this.height;
            node.minWidth = this.minWidth;
            node.minHeight = this.minHeight;
            node.pos = this.pos;
            node.selected = false;
            node.visible = true;
            node.immutable = this.immutable;
            return node;
        }

        touches(point) {
            point = applyView(point);
            const p1 = this.pos.plus(Vec(-this.width, -this.height));
            const p2 = this.pos.plus(Vec(this.width, -this.height));
            const p3 = this.pos.plus(Vec(-this.width, this.height));
            const p4 = this.pos.plus(Vec(this.width, this.height));
            const res = TwoD.pointIntersectRect(point, p1, p2, p3, p4);
            return res;
        }

        touches_row(point) {
            point = applyView(point);
            const offset = this.pos.minus(Vec(this.width, this.height)).plus(Node.textPadding);
            const y = point.minus(offset).y;
            let row = Math.floor(y / (this.text.ySpacing + this.text.textSize));
            row = Math.max(0, Math.min(row, this.text.getSize().rows - 1));
            return row;
        }

        resize() {
            let size = this.text.getSize();
            size = { x: size.x / 2 + Node.textPadding.x, y: size.y / 2 + Node.textPadding.y }
            if (this.width != size.x || this.height != size.y) {
                this.width = Math.max(this.minWidth, size.x);
                this.height = Math.max(this.minHeight, size.y);
            }
        }

        draw() {
            this.resize();
            if (!this.visible) {
                return;
            }
            if (this.selected) {
                p5.stroke(ALPHA(COLORS["lightGrey"], view.alpha));
            } else {
                p5.noStroke();
            }
            if (this.immutable) {
                p5.fill(ALPHA(COLORS["lightBlue"], view.alpha));
            } else {
                p5.fill(ALPHA(COLORS["mediumOrange"], view.alpha));
            }

            p5.strokeWeight(Node.strokeWeight);
            p5.rect(this.pos.x - this.width, this.pos.y - this.height, this.width * 2, this.height * 2, Node.rounding);

            const offset = this.pos.minus(Vec(this.width, this.height)).plus(Node.textPadding);
            this.text.draw(offset.x, offset.y);
        }
    }
    global.Node = Node;

    class Edge extends Id {
        static lineWidth = 3;
        static loopSize = 10;
        static triangle_height = 20;
        static triangle_width = 15;
        static touchWidth = 1.5;

        constructor(predecessor, id, text, start, end) {
            super(predecessor, id);
            this.text = new Text(text, false);
            this.start = start;
            this.end = end;
            this.selected = false;
            this.visible = true;
        }

        copy() {
            const edge = new Edge();
            edge.predecessor = this.predecessor;
            edge.id = this.id;
            edge.text = this.text.copy();
            edge.start = this.start;
            edge.end = this.end;
            edge.selected = false;
            edge.visible = true;
            return edge;
        }


        getBorderPoint(start, end) {
            const diff = end.pos.minus(start.pos);
            if (diff.x === 0 && diff.y === 0) {
                return undefined;
            } else if (diff.x === 0) {
                return start.pos.plus(Vec(0, start.height * Math.sign(diff.y)));
            } else if (diff.y === 0) {
                return start.pos.plus(Vec(start.width * Math.sign(diff.x), 0));
            } else if (start.height === 0 || start.width === 0) {
                return start.pos;
            }
            const relative = Vec(diff.x * start.height, diff.y * start.width);
            let offset = undefined;
            const size = Vec(start.width, start.height);
            if (Math.abs(relative.y / relative.x) <= 1) {
                offset = size.multi(Vec(Math.sign(relative.x), relative.y / Math.abs(relative.x)));
            } else {
                offset = size.multi(Vec(relative.x / Math.abs(relative.y), Math.sign(relative.y)));
            }
            return start.pos.plus(offset);
        }

        getBorderPoints() {
            const start = this.getBorderPoint(this.start, this.end);
            const end = this.getBorderPoint(this.end, this.start);
            if (start === undefined || end === undefined || end.minus(this.start.pos).distance() <= start.minus(this.start.pos).distance()) {
                return { start: undefined, end: undefined, distance: 0 };
            }
            return { start: start, end: end, distance: end.minus(start).distance() };
        }

        touches(point, bidirectional) {
            point = applyView(point);
            const { start: startBorder, end: endBorder, distance: distance } = this.getBorderPoints();
            if (distance <= 0) {
                return false;
            }

            const b = bidirectional[this.start.id + this.end.id];
            const diff = endBorder.minus(startBorder);
            const orthodiff = diff.orthogonal().normalized();

            let p1 = undefined;
            let p2 = undefined;
            let p3 = undefined;
            let p4 = undefined;
            const width = Edge.triangle_width;
            if (b !== undefined && b.length > 1) {
                p1 = startBorder.plus(orthodiff.times(width * Edge.touchWidth));
                p2 = startBorder;
                p3 = endBorder.plus(orthodiff.times(width * Edge.touchWidth));
                p4 = endBorder;
            } else {
                p1 = startBorder.plus(orthodiff.times(width * Edge.touchWidth));
                p2 = startBorder.plus(orthodiff.times(width * -Edge.touchWidth));
                p3 = endBorder.plus(orthodiff.times(width * Edge.touchWidth));
                p4 = endBorder.plus(orthodiff.times(width * -Edge.touchWidth));
            }

            return TwoD.pointIntersectRect(point, p1, p2, p3, p4);
        }

        draw(head = false) {
            if (!this.visible) {
                return;
            }

            const { start: startBorder, end: endBorder, distance: distance } = this.getBorderPoints();
            if (distance <= 0) {
                return;
            }
            const diff = endBorder.minus(startBorder);
            const normdiff = diff.normalized();
            const height = Edge.triangle_height;
            const width = Edge.triangle_width;
            const bottom = endBorder.minus(normdiff.times(height));

            const textSizes = this.text.getSize();
            const fadeWidth = Math.max(Edge.triangle_height, textSizes.x);
            const oldAlpha = view.alpha;
            view.alpha = distance < fadeWidth ? view.alpha * distance / fadeWidth : view.alpha;

            if (head) {
                const orthodiff = diff.orthogonal().normalized();
                const left = bottom.plus(orthodiff.times(-width / 2));
                const right = bottom.plus(orthodiff.times(width / 2));
                if (this.selected) {
                    p5.fill(ALPHA(COLORS["lightGrey"], view.alpha));
                } else {
                    p5.fill(ALPHA(COLORS["lightBlue"], view.alpha));
                }
                p5.noStroke();
                p5.triangle(left.x, left.y, endBorder.x, endBorder.y, right.x, right.y);
                view.alpha = oldAlpha;
                return;
            }

            p5.strokeWeight(Edge.lineWidth);
            p5.stroke(ALPHA(COLORS["lightBlue"], view.alpha));
            p5.line(startBorder.x, startBorder.y, bottom.x, bottom.y);

            const mid = startBorder.plus(diff.times(0.5));
            const angle = diff.times(-1).angle(Vec(1, 0));
            p5.push()
            p5.translate(mid.x, mid.y);
            p5.rotate(-angle);
            if (-diff.x < 0) {
                p5.scale(-1);
            }
            let y = textSizes.y / 3;
            y = startBorder.x < endBorder.x ? - 4 * y : y;
            p5.translate(-textSizes.x / 2, y);
            this.text.draw(0, 0);
            p5.pop();
            view.alpha = oldAlpha;
        }
    }
    global.Edge = Edge;

    class Graph extends Id {
        constructor(predecessor, id, nodes, edges) {
            super(predecessor, id);
            this.index = predecessor === undefined ? 0 : predecessor.index + 1;
            const date = new Date();
            this.timestamp = date.getFullYear() + "-" +
                ("0" + (date.getMonth() + 1)).slice(-2) + "-" +
                ("0" + date.getDate()).slice(-2) + "T" +
                ("0" + date.getHours()).slice(-2) + ":" +
                ("0" + date.getMinutes()).slice(-2) + ":" +
                ("0" + date.getSeconds()).slice(-2);
            this.approval = false;
            this.nodes = nodes;
            this.edges = edges;
            this.bidirectional = {};
            this.edges.forEach(edge => {
                if (this.bidirectional[edge.start.id + edge.end.id] !== undefined) {
                    this.bidirectional[edge.start.id + edge.end.id].push(edge);
                    this.bidirectional[edge.end.id + edge.start.id].push(edge);
                } else {
                    this.bidirectional[edge.start.id + edge.end.id] = [edge];
                    this.bidirectional[edge.end.id + edge.start.id] = [edge];
                }
            });
        }

        toggle_approval() {
            this.approval = !this.approval;
        }

        touches_nodes(pos) {
            let touching = [];
            for (let i = 0; i < this.nodes.length; i++) {
                if (this.nodes[i].touches(pos)) {
                    touching.push(i);
                }
            }
            return touching;
        }

        touches_edges(pos) {
            let touching = [];
            for (let i = 0; i < this.edges.length; i++) {
                if (this.edges[i].touches(pos, this.bidirectional)) {
                    touching.push(i);
                }
            }
            return touching;
        }

        draw() {
            for (let i = 0; i < this.edges.length; i++) {
                this.edges[i].draw();
            }
            for (let i = 0; i < this.edges.length; i++) {
                this.edges[i].draw(true);
            }
            for (let i = 0; i < this.nodes.length; i++) {
                this.nodes[i].draw();
            }
        }
    }
    global.Graph = Graph;
}

export { GRAPH };