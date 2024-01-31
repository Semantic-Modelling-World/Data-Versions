const GRAPH = (exp) => {
    const p5 = exp.p5;
    const Vec = exp.Vec;
    const TwoD = exp.TwoD;
    const COLORS = exp.COLORS;
    const applyAlpha = exp.applyAlpha;
    const view = exp.view;
    const applyView = exp.applyView;
    const Text = exp.Text;

    class Node {
        static textPadding = Vec(15, 16);
        static minWidth = (Text.getWidth("O") + Node.textPadding.x * 2);
        static minHeight = (Text.textSize + Node.textPadding.y * 2);
        static rounding = 10;
        static strokeWeight = 3;
        static selectedColor = COLORS["lightGrey"];
        static mutableColor = COLORS["lightBlue"];
        static immutableColor = COLORS["mediumOrange"];

        constructor(text, pos, color = undefined) {
            this.text = new Text(text);
            this.pos = pos;
            this.color = color;

            this.id = exp.id++;
            this.width = 0;
            this.height = 0;
            this.visible = true;
            this.selected = false;
            this.editable = true;
            this.resize();

            // attributes for spawning copies
            this.mutable = true;
            this.spawn_vector = Vec(1, 0.5);  // current direction in which copied nodes spawn
            this.subs = [];
            this.edgeText = undefined;
            this.main = undefined;
        }

        copy() {
            const node = new Node();
            node.text = this.text.copy();
            node.pos = this.pos;
            node.color = this.color;

            node.id = this.id;
            node.width = this.width;
            node.height = this.height;
            node.visible = true;
            node.selected = false;
            node.editable = this.editable;
            node.resize();

            node.mutable = this.mutable;
            node.spawn_vector = this.spawn_vector;
            node.subs = this.subs.slice();
            node.edgeText = this.edgeText;
            node.main = this.main;
            return node;
        }

        touches(point) {
            point = applyView(point);
            const p1 = this.pos;
            const p2 = this.pos.plus(Vec(this.width, 0));
            const p3 = this.pos.plus(Vec(0, this.height));
            const p4 = this.pos.plus(Vec(this.width, this.height));
            const res = TwoD.pointIntersectRect(point, p1, p2, p3, p4);
            return res;
        }

        resize() {
            let size = this.text.getSize();
            size = { x: size.x + Node.textPadding.x * 2, y: size.y + Node.textPadding.y * 2 }
            if (this.width != size.x || this.height != size.y) {
                this.width = Math.max(Node.minWidth, size.x);
                this.height = Math.max(Node.minHeight, size.y);
            }
        }

        draw() {
            if (!this.visible) {
                return;
            }
            this.resize();
            if (this.color !== undefined) {
                p5.noStroke();
                p5.fill(applyAlpha(this.color));
            } else {
                if (this.selected) {
                    p5.stroke(applyAlpha(Node.selectedColor));
                    p5.strokeWeight(Node.strokeWeight);
                } else {
                    p5.noStroke();
                }
                if (!this.mutable) {
                    p5.fill(applyAlpha(Node.mutableColor));
                } else {
                    p5.fill(applyAlpha(Node.immutableColor));
                }
            }
            p5.rect(this.pos.x, this.pos.y, this.width, this.height, Node.rounding);

            const offset = this.pos.plus(Node.textPadding);
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
        constructor(text, start, end) {
            this.texts = [new Text(text, false)]; // Other than nodes, edges can hold multiple texts
            this.start = start;
            this.end = end;

            this.id = exp.id++;
            this.visible = true;
            this.selected = false;
        }

        copy() {
            const edge = new Edge();
            edge.texts = this.texts.map(text => text.copy());
            edge.start = this.start;
            edge.end = this.end;

            edge.id = this.id;
            edge.visible = true;
            edge.selected = false;
            return edge;
        }

        getBorderPoint(start, end) {
            const startSize = Vec(start.width / 2, start.height / 2);
            const endSize = Vec(end.width / 2, end.height / 2);
            const startCenter = start.pos.plus(startSize);
            const endCenter = end.pos.plus(endSize);
            const diff = endCenter.minus(startCenter);
            if (diff.x === 0 && diff.y === 0) {
                return undefined;
            } else if (diff.x === 0) {
                return startCenter.plus(Vec(0, startSize.y * Math.sign(diff.y)));
            } else if (diff.y === 0) {
                return startCenter.plus(Vec(startSize.x * Math.sign(diff.x), 0));
            } else if (startSize.y === 0 || startSize.x === 0) {
                return startCenter;
            }
            const relative = Vec(diff.x * startSize.y, diff.y * startSize.x);
            let offset = undefined;
            if (Math.abs(relative.y / relative.x) <= 1) {
                offset = startSize.multi(Vec(Math.sign(relative.x), relative.y / Math.abs(relative.x)));
            } else {
                offset = startSize.multi(Vec(relative.x / Math.abs(relative.y), Math.sign(relative.y)));
            }
            return startCenter.plus(offset);
        }

        getBorderPoints() {
            const start = this.getBorderPoint(this.start, this.end);
            const end = this.getBorderPoint(this.end, this.start);
            if (start === undefined || end === undefined || end.minus(this.start.pos).distance() <= start.minus(this.start.pos).distance()) {
                return { start: undefined, end: undefined, distance: 0 };
            }
            return { start: start, end: end, distance: end.minus(start).distance() };
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
            p5.translate(mid.x, mid.y);
            p5.rotate(-angle);
            if (-diff.x < 0) {
                p5.scale(-1);
            }
            let y = textSizes.y / 3;
            y = startBorder.x < endBorder.x ? - 4 * y : y;
            p5.translate(-textSizes.x / 2, y);

            let offset = { x: 0, y: 0, rows: 0 };
            for (let i = 0; i < this.texts.length; i++) {
                offset = this.texts[i].draw(offset.x, 0);
                if (this.texts.length > 1 && i + 1 !== this.texts.length) {
                    offset = Edge.separator.draw(offset.x, 0);
                }
            }
            p5.pop();
            view.alpha = oldAlpha;
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
                if (this.nodes[i].visible && this.nodes[i].touches(pos)) {
                    touching.push(i);
                }
            }
            return touching;
        }

        touches_edges(pos) {
            let touching = [];
            for (let i = 0; i < this.edges.length; i++) {
                if (this.edges[i].visible && this.edges[i].touches(pos)) {
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
            // returns the edges of which a node is the start or end node
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
            // Not used right now but useful for deleting nodes
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
            // Not used right now but useful for deleting whole edges
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