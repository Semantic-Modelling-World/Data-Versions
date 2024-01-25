const GRAPH = (exp) => {
    const p5 = exp.p5;
    const Vec = exp.Vec;
    const TwoD = exp.TwoD;
    const COLORS = exp.COLORS;
    const applyAlpha = exp.applyAlpha;
    const view = exp.view;
    const applyView = exp.applyView;
    const Text = exp.Text;
    const Mat = exp.Mat;

    class Node {
        static textPadding = Vec(15, 16);
        static minWidth = (Text.getWidth("O") + Node.textPadding.x * 2) / 2;
        static minHeight = (Text.textSize + Node.textPadding.y * 2) / 2;
        static rounding = 10;
        static strokeWeight = 3;

        constructor(text, pos, minWidth = Node.minWidth, minHeight = Node.minHeight) {
            this.id = exp.id++;
            this.main = undefined;
            this.edgeText = undefined;
            this.subs = [];
            this.text = new Text(text);
            this.width = 0;  // half width like radius
            this.height = 0;  // half height like radius
            this.minWidth = minWidth;
            this.minHeight = minHeight;
            this.pos = pos;
            this.mutable = true;
            this.editable = true;
            this.visible = true;
            this.selected = false;
            this.spawn_vector = Vec(1, 0.5);  // direction in which copied nodes spawn
            this.resize();
        }

        copy() {
            const node = new Node();
            node.id = this.id;
            node.main = this.main;
            node.edgeText = this.edgeText;
            node.subs = this.subs.slice();
            node.text = this.text.copy();
            node.width = this.width;
            node.height = this.height;
            node.minWidth = this.minWidth;
            node.minHeight = this.minHeight;
            node.pos = this.pos;
            node.mutable = this.mutable;
            node.editable = this.editable;
            node.visible = true;
            node.selected = false;
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

        resize() {
            let size = this.text.getSize();
            size = { x: size.x / 2 + Node.textPadding.x, y: size.y / 2 + Node.textPadding.y }
            if (this.width != size.x || this.height != size.y) {
                this.width = Math.max(this.minWidth, size.x);
                this.height = Math.max(this.minHeight, size.y);
            }
        }

        draw() {
            if (!this.visible) {
                return;
            }
            this.resize();
            if (this.selected) {
                p5.stroke(applyAlpha(COLORS["lightGrey"]));
            } else {
                p5.noStroke();
            }
            if (!this.mutable) {
                p5.fill(applyAlpha(COLORS["lightBlue"]));
            } else {
                p5.fill(applyAlpha(COLORS["mediumOrange"]));
            }

            p5.strokeWeight(Node.strokeWeight);
            p5.rect(this.pos.x - this.width, this.pos.y - this.height, this.width * 2, this.height * 2, Node.rounding);

            const offset = this.pos.minus(Vec(this.width, this.height)).plus(Node.textPadding);
            this.text.draw(offset.x, offset.y);
        }
    }
    exp.Node = Node;

    class Edge {
        static lineWidth = 3;
        static touchWidth = 3;
        static loopSize = 10;
        static triangle_height = 20;
        static triangle_width = 15;
        static separator = new Text(", ");
        static touchMargin = 2;

        constructor(text, start, end) {
            this.id = exp.id++;
            this.texts = [new Text(text, false)];
            this.start = start;
            this.end = end;
            this.visible = true;
            this.selected = false;
            this.mutable = true;
            this.editable = true;
        }

        copy() {
            const edge = new Edge();
            edge.id = this.id;
            edge.texts = this.texts.map(text => text.copy());
            edge.start = this.start;
            edge.end = this.end;
            edge.visible = true;
            edge.selected = false;
            edge.mutable = this.mutable;
            edge.editable = this.editable;
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

        touches(point) {
            point = applyView(point);
            const { start: startBorder, end: endBorder, distance: distance } = this.getBorderPoints();
            if (distance <= 0) {
                return false;
            }

            const diff = endBorder.minus(startBorder);
            const orthodiff = diff.orthogonal().normalized();

            let p1 = undefined;
            let p2 = undefined;
            let p3 = undefined;
            let p4 = undefined;
            p1 = startBorder.plus(orthodiff.times(Edge.touchWidth / 2));
            p2 = startBorder.plus(orthodiff.times(-Edge.touchWidth / 2));
            p3 = endBorder.plus(orthodiff.times(Edge.touchWidth / 2));
            p4 = endBorder.plus(orthodiff.times(-Edge.touchWidth / 2));

            return TwoD.pointIntersectRect(point, p1, p2, p3, p4);
        }

        touches_text(point) {
            point = applyView(point);
            const { start: startBorder, end: endBorder, distance: distance } = this.getBorderPoints();
            if (distance <= 0) {
                return;
            }
            const diff = endBorder.minus(startBorder);
            let textSizes = { x: 0, y: 0 };
            for (let i = 0; i < this.texts.length; i++) {
                const sizes = this.texts[i].getSize();
                textSizes.x += sizes.x;
                textSizes.y = sizes.y;
            }
            textSizes.x += Edge.separator.getSize().x * Math.max(0, this.texts.length - 1);

            const mid = startBorder.plus(diff.times(0.5));
            const angle = diff.times(-1).angle(Vec(1, 0));
            Mat.reset();
            Mat.translate(mid.x, mid.y);
            Mat.rotate(-angle)
            if (-diff.x < 0) {
                Mat.scaleX(-1);
                Mat.scaleY(-1);
            }
            let y = textSizes.y / 3;
            y = startBorder.x < endBorder.x ? - 4 * y : y;
            Mat.translate(-textSizes.x / 2, y);
            p5.noStroke();
            let start = { x: 0, y: 0 };
            for (let i = 0; i < this.texts.length; i++) {
                const offset = this.texts[i].getSize(start.x, 0, false);
                const vec = Vec(offset.x, offset.y).minus(Vec(start.x, 0));
                const points = Mat.applyToArray([
                    start.x - Edge.touchMargin,
                    -Edge.touchMargin,
                    start.x - Edge.touchMargin,
                    vec.y + Edge.touchMargin,
                    start.x + vec.x + Edge.touchMargin,
                    vec.y + Edge.touchMargin,
                    start.x + vec.x + Edge.touchMargin,
                    -Edge.touchMargin]);
                if (TwoD.pointIntersectRect(point, Vec(points[0], points[1]), Vec(points[2], points[3]),
                    Vec(points[4], points[5]), Vec(points[6], points[7]))) {
                    return this.texts[i];
                }
                if (this.texts.length > 1 && i + 1 !== this.texts.length) {
                    start = Edge.separator.getSize(offset.x, 0, false);
                }
            }
            return;
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

            let textSizes = { x: 0, y: 0 };
            for (let i = 0; i < this.texts.length; i++) {
                const sizes = this.texts[i].getSize();
                textSizes.x += sizes.x;
                textSizes.y = sizes.y;
            }
            textSizes.x += Edge.separator.getSize().x * Math.max(0, this.texts.length - 1);

            const fadeWidth = Math.max(Edge.triangle_height, textSizes.x);
            const oldAlpha = view.alpha;
            view.alpha = distance < fadeWidth ? view.alpha * distance / fadeWidth : view.alpha;

            if (head) {
                const orthodiff = diff.orthogonal().normalized();
                const left = bottom.plus(orthodiff.times(-width / 2));
                const right = bottom.plus(orthodiff.times(width / 2));
                p5.fill(applyAlpha(COLORS["lightBlue"]));
                p5.noStroke();
                p5.triangle(left.x, left.y, endBorder.x, endBorder.y, right.x, right.y);
                view.alpha = oldAlpha;
                return;
            }

            p5.strokeWeight(Edge.lineWidth);
            p5.stroke(applyAlpha(COLORS["lightBlue"]));
            p5.line(startBorder.x, startBorder.y, bottom.x, bottom.y);

            const mid = startBorder.plus(diff.times(0.5));
            const angle = diff.times(-1).angle(Vec(1, 0));
            p5.push()
            Mat.reset();
            p5.translate(mid.x, mid.y);
            Mat.translate(mid.x, mid.y);
            p5.rotate(-angle);
            Mat.rotate(-angle)
            if (-diff.x < 0) {
                p5.scale(-1);
            }
            let y = textSizes.y / 3;
            y = startBorder.x < endBorder.x ? - 4 * y : y;
            p5.translate(-textSizes.x / 2, y);
            Mat.translate(-textSizes.x / 2, y);

            let offset = { x: 0, y: 0, rows: 0 };
            for (let i = 0; i < this.texts.length; i++) {
                offset = this.texts[i].draw(offset.x, 0);
                if (this.texts.length > 1 && i + 1 !== this.texts.length) {
                    offset = Edge.separator.draw(offset.x, 0);
                }
            }
            p5.pop();
            view.alpha = oldAlpha;

            this.touches_text(Vec(p5.mouseX, p5.mouseY));
        }
    }
    exp.Edge = Edge;

    class Graph {
        constructor() {
            this.nodes = [];
            this.edges = [];
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
                if (this.edges[i].touches(pos)) {
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

        addNode(node) {
            node.id = exp.id++;
            this.nodes.push(node);
        }

        findNode(node) {
            for (let i = 0; i < this.nodes.length; i++) {
                if (node.id !== this.nodes[i].id && node.text.equals(this.nodes[i].text)) {
                    if (node.mutable === this.nodes[i].mutable && node.editable === this.nodes[i].editable) {
                        return this.nodes[i];
                    }
                }
            }
            return undefined;
        }

        findConnectedEdges(node) {
            const startEdges = [];
            const endEdges = [];
            for (let i = 0; i < this.edges.length; i++) {
                if (node.id === this.edges[i].start.id) {
                    startEdges.push(this.edges[i]);
                }
                if (node.id === this.edges[i].end.id) {
                    endEdges.push(this.edges[i]);
                }
            }
            return { start: startEdges, end: endEdges };
        }

        deleteNode(node) {
            const nodes = [];
            const edges = [];
            for (let i = 0; i < this.nodes.length; i++) {
                if (node.id !== this.nodes[i].id) {
                    nodes.push(this.nodes[i]);
                }
            }
            for (let i = 0; i < this.edges.length; i++) {
                if (node.id !== this.edges[i].start.id && node.id !== this.edges[i].end.id) {
                    edges.push(this.edges[i]);
                }
            }
            this.nodes = nodes;
            this.edges = edges;
        }

        addEdge(edge) {
            for (let i = 0; i < this.edges.length; i++) {
                if (edge.start.id === this.edges[i].start.id && edge.end.id === this.edges[i].end.id) {
                    for (let j = 0; j < edge.texts.length; j++) {
                        let duplicate = false;
                        for (let k = 0; k < this.edges[i].texts.length; k++) {
                            if (this.edges[i].texts[k].equals(edge.texts[j])) {
                                duplicate = true;
                            }
                        }
                        if (!duplicate) {
                            this.edges[i].texts.push(edge.texts[j]);
                        }
                    }
                    return;
                }
            }
            edge.id = exp.id++;
            this.edges.push(edge);
        }

        deleteEdge(edge) {
            const edges = [];
            for (let i = 0; i < this.edges.length; i++) {
                if (edge.id !== this.edges[i].id) {
                    edges.push(this.edges[i]);
                }
            }
            this.edges = edges;
        }
    }
    exp.Graph = Graph;
}

export { GRAPH };