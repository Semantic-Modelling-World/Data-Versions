const GRAPH = (global) => {
    const p5 = global.p5;
    const Vec = global.Vec;
    const TwoD = global.TwoD;
    const COLORS = global.COLORS;
    const ALPHA = global.ALPHA;
    const alpha = [255];
    global.alpha = alpha;
    const viewpoint = [Vec(0, 0)];
    global.viewpoint = viewpoint;
    const RDF = global.RDF;


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
        constructor(predecessor, id, label, pos, width = 100, height = 45) {
            super(predecessor, id);
            this.label = label;
            this.width = width;  // half width
            this.height = height;
            this.setPos(pos);
            this.textWidth = 15;
            this.selected = false;
            this.editing = -1;
            this.strokeWeight = 3;
            this.rounding = 10;
            this.time_offset = Date.now();
        }

        setPos(pos) {
            this.pos = pos.minus(viewpoint[0]);
        }

        touches(point) {
            point = point.minus(viewpoint[0]);
            const p1 = this.pos.plus(Vec(-this.width, -this.height));
            const p2 = this.pos.plus(Vec(this.width, -this.height));
            const p3 = this.pos.plus(Vec(-this.width, this.height));
            const p4 = this.pos.plus(Vec(this.width, this.height));
            const res = TwoD.pointIntersectRect(point, p1, p2, p3, p4);
            return res;
        }

        draw() {
            if (this.selected) {
                p5.stroke(ALPHA(COLORS["lightGrey"], alpha[0]));
            } else {
                p5.noStroke();
            }
            p5.fill(ALPHA(COLORS["lightBlue"], alpha[0]));
            p5.strokeWeight(this.strokeWeight);
            p5.rect(this.pos.x - this.width, this.pos.y - this.height, this.width * 2, this.height * 2, this.rounding);


            p5.noStroke();
            p5.textSize(this.textWidth);
            p5.textAlign(p5.CENTER, p5.CENTER);
            p5.fill(ALPHA(COLORS["black"], alpha[0]));
            p5.text(this.label, this.pos.x, this.pos.y);
            const fullTextWidth = p5.textWidth(this.label);
            const textWidth = p5.textWidth(this.label.slice(0, this.editing));
            p5.stroke(ALPHA(COLORS["black"], alpha[0]));
            p5.strokeWeight(2);
            if (this.editing > -1 && (Date.now() - this.time_offset) % 1000 < 500) {
                p5.line(this.pos.x - fullTextWidth / 2 + textWidth,
                    this.pos.y + this.textWidth / 2,
                    this.pos.x - fullTextWidth / 2 + textWidth,
                    this.pos.y - this.textWidth / 2)
            }
        }
    }
    global.Node = Node;

    class Edge extends Id {
        constructor(predecessor, id, label, start, end) {
            super(predecessor, id);
            this.label = label;
            this.start = start;
            this.end = end;
            this.lineWidth = 3;
            this.textWidth = 15;
            this.loopSize = 10;
            this.triangle_height = 20;
            this.triangle_width = 15;
            this.selected = false;
            this.editing = -1;
            this.time_offset = Date.now();
        }


        touches(point, bidirectional) {
            point = point.minus(viewpoint[0]);
            const [startBorder, endBorder, distance] = this.getBorderPoints();
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
            const width = this.triangle_width;
            if (b !== undefined && b.length > 1) {
                p1 = startBorder.plus(orthodiff.times(width * 1.2));
                p2 = startBorder;
                p3 = endBorder.plus(orthodiff.times(width * 1.2));
                p4 = endBorder;
            } else {
                p1 = startBorder.plus(orthodiff.times(width * 1.2));
                p2 = startBorder.plus(orthodiff.times(width * -1.2));
                p3 = endBorder.plus(orthodiff.times(width * 1.2));
                p4 = endBorder.plus(orthodiff.times(width * -1.2));
            }

            return TwoD.pointIntersectRect(point, p1, p2, p3, p4);
        }

        getBorderPoint(start, end) {
            const diff = end.pos.minus(start.pos);
            if (diff.x === 0 && diff.y === 0) {
                return undefined;
            } else if (diff.x === 0) {
                return start.pos.plus(Vec(0, start.height * Math.sign(diff.y)));
            } else if (diff.y === 0) {
                return start.pos.plus(Vec(start.width * Math.sign(diff.x), 0));
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
                return [undefined, undefined, 0];
            }
            return [start, end, end.minus(start).distance()];
        }

        draw(bidirectional, head = false) {
            const [startBorder, endBorder, distance] = this.getBorderPoints();
            if (distance <= 0) {
                return;
            }
            const diff = endBorder.minus(startBorder);
            const normdiff = diff.normalized();
            const height = this.triangle_height;
            const width = this.triangle_width;
            const bottom = endBorder.minus(normdiff.times(height));

            const fullTextWidth = p5.textWidth(this.label);
            let fade = alpha[0];
            fade = distance < fullTextWidth ? fade * distance / fullTextWidth : fade;
            p5.fill(ALPHA(COLORS["mediumBlue"], fade));
            p5.stroke(ALPHA(COLORS["mediumBlue"], fade));
            p5.strokeWeight(this.lineWidth);

            if (head) {
                const orthodiff = diff.orthogonal().normalized();
                const left = bottom.plus(orthodiff.times(-width / 2));
                const right = bottom.plus(orthodiff.times(width / 2));
                if (this.selected) {
                    p5.fill(ALPHA(COLORS["lightGrey"], fade));
                }
                p5.noStroke();
                p5.triangle(left.x, left.y, endBorder.x, endBorder.y, right.x, right.y);
                return;
            }

            p5.line(startBorder.x, startBorder.y, bottom.x, bottom.y);
            p5.noStroke();
            const mid = startBorder.plus(endBorder.minus(startBorder).times(0.5));
            p5.textSize(this.textWidth);
            p5.textAlign(p5.CENTER, p5.CENTER);
            p5.fill(ALPHA(COLORS["black"], fade));
            const angle = diff.times(-1).angle(Vec(1, 0));
            p5.push()
            p5.translate(mid.x, mid.y);
            p5.rotate(-angle);
            if (-diff.x < 0) {
                p5.scale(-1);
            }
            let y = 0;
            if (startBorder.x < endBorder.x) {
                y = (-this.textWidth / 1.5);
                p5.text(this.label, 0, y);
            } else {
                y = (this.textWidth / 1.5);
                p5.text(this.label, 0, y);
            }
            const textWidth = p5.textWidth(this.label.slice(0, this.editing));
            p5.stroke(ALPHA(COLORS["black"], alpha[0]));
            p5.strokeWeight(2);
            if (this.editing > -1 && (Date.now() - this.time_offset) % 1000 < 500) {
                p5.line(-fullTextWidth / 2 + textWidth, y + this.textWidth / 2, -fullTextWidth / 2 + textWidth, y - this.textWidth / 2, this)
            }
            p5.pop();
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
                if (this.bidirectional[edge.start.id + edge.end.id]) {
                    this.bidirectional[edge.start.id + edge.end.id].push(edge);
                    this.bidirectional[edge.end.id + edge.start.id].push(edge);
                } else {
                    this.bidirectional[edge.start.id + edge.end.id] = [edge];
                    this.bidirectional[edge.end.id + edge.start.id] = [edge];
                }
            });
            this.rdf = RDF.parse(this);
            this.totalRDF = this.predecessor === undefined ? this.rdf : this.predecessor.totalRDF.add(this.rdf);
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
                this.edges[i].draw(this.bidirectional);
            }
            for (let i = 0; i < this.edges.length; i++) {
                this.edges[i].draw(this.bidirectional, true);
            }
            for (let i = 0; i < this.nodes.length; i++) {
                this.nodes[i].draw();
            }
        }
    }
    global.Graph = Graph;
}

export { GRAPH };