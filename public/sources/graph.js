const GRAPH = (global) => {
    const p5 = global.p5;
    const Vec = global.Vec;
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
        constructor(predecessor, id, label, pos, r = 45) {
            super(predecessor, id);
            this.label = label;
            this.r = r;
            this.setPos(pos);
            this.textWidth = 15;
            this.selected = false;
            this.editing = -1;
            this.strokeWeight = 3;
            this.time_offset = Date.now();
        }

        setPos(pos) {
           this.pos = pos.minus(viewpoint[0]);
        }

        touches(pos) {
            pos = pos.minus(viewpoint[0]);
            return this.pos.minus(pos).distance() <= this.r;
        }

        draw() {
            if (this.selected) {
                p5.stroke(ALPHA(COLORS["lightGrey"], alpha[0]));
            } else {
                p5.noStroke();
            }
            p5.fill(ALPHA(COLORS["lightBlue"], alpha[0]));
            p5.strokeWeight(this.strokeWeight);
            p5.ellipse(this.pos.x, this.pos.y, this.r * 2, this.r * 2);

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

        area(p1, p2, p3) {
            return Math.abs((p2.x * p1.y - p1.x * p2.y) + (p3.x * p2.y - p2.x * p3.y) + (p1.x * p3.y - p3.x * p1.y)) / 2;
        }

        endpoints() {
            const startVec = this.start.pos;
            const endVec = this.end.pos;
            const diff = startVec.minus(endVec);
            if (diff.distance() <= this.start.r + this.end.r) {
                return [this.start.pos, this.end.pos];
            }
            const normdiff = diff.normalized();
            const top = endVec.plus(normdiff.times(this.end.r));
            const bottom = startVec.plus(normdiff.times(-this.start.r));
            return [bottom, top];
        }

        touches(pos, bidirectional) {
            pos = pos.minus(viewpoint[0]);
            const startVec = this.start.pos;
            const endVec = this.end.pos;
            const diff = startVec.minus(endVec);
            const normdiff = diff.normalized();
            const top = endVec.plus(normdiff.times(this.end.r - 1));
            const bottom = startVec.minus(normdiff.times(this.start.r - 1));
            const width = this.triangle_width;
            const orthodiff = diff.orthogonal().normalized();
            let p2 = undefined;
            let p4 = undefined;
            const b = bidirectional[this.start.id + this.end.id];
            if (b !== undefined && b.length > 1) {
                p2 = bottom;
                p4 = top;
            } else {
                p2 = bottom.plus(orthodiff.times(width * 1.2));
                p4 = top.plus(orthodiff.times(width * 1.2));
            }
            const p1 = bottom.plus(orthodiff.times(-width * 1.2));
            const p3 = top.plus(orthodiff.times(-width * 1.2));
            const rectArea = p1.minus(p2).distance() * p1.minus(p3).distance();
            const triArea = this.area(p1, pos, p4) + this.area(p4, pos, p3) + this.area(p3, pos, p2) + this.area(pos, p2, p1);
            return triArea <= rectArea;
        }

        draw(bidirectional = {}) {
            const startVec = this.start.pos;
            const endVec = this.end.pos;
            const diff = startVec.minus(endVec);
            if (diff.distance() <= this.start.r + this.end.r) {
                return;
            }
            const normdiff = diff.normalized();
            const top = endVec.plus(normdiff.times(this.end.r));
            const height = this.triangle_height;
            const width = this.triangle_width;
            const bottom = top.plus(normdiff.times(height));
            const orthodiff = diff.orthogonal().normalized();
            const left = bottom.plus(orthodiff.times(-width / 2));
            const right = bottom.plus(orthodiff.times(width / 2));

            p5.strokeWeight(this.lineWidth);
            if (this.selected) {
                p5.fill(ALPHA(COLORS["lightGrey"], alpha[0]));
                p5.stroke(ALPHA(COLORS["lightGrey"], alpha[0]));
            } else {
                p5.fill(ALPHA(COLORS["mediumBlue"], alpha[0]));
                p5.stroke(ALPHA(COLORS["mediumBlue"], alpha[0]));
            }
            let start = startVec;
            const b = bidirectional[this.start.id + this.end.id];
            const rTop = startVec.plus(normdiff.times(-this.start.r));
            if (b !== undefined && b.length > 1) {
                for (let i = 0; i < b.length; i++) {
                    if (b[i].id === this.id) {
                        continue;
                    }
                    if (b[i].selected) {
                        p5.stroke(ALPHA(COLORS["lightGrey"], alpha[0]));
                    }
                    if (b[i].start.id !== undefined && b[i].end.id !== undefined) {
                        start = rTop.plus(normdiff.times(-height - 2));
                    }
                }
            }
            p5.line(startVec.x, startVec.y, bottom.x, bottom.y);

            p5.noStroke();
            p5.triangle(left.x, left.y, top.x, top.y, right.x, right.y);

            const mid = rTop.plus(top.minus(rTop).times(0.5));
            p5.textSize(this.textWidth);
            p5.textAlign(p5.CENTER, p5.CENTER);
            p5.fill(ALPHA(COLORS["black"], alpha[0]));
            const angle = diff.times(-1).angle(Vec(1, 0));
            p5.push()
            p5.translate(mid.x, mid.y);
            p5.rotate(-angle);
            if (-diff.x < 0) {
                p5.scale(-1);
            }
            let y = 0;
            if (startVec.x <= endVec.x) {
                y = (-this.textWidth / 1.5);
                p5.text(this.label, 0, y);
            } else {
                y = (this.textWidth / 1.5);
                p5.text(this.label, 0, y);
            }
            const fullTextWidth = p5.textWidth(this.label);
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
            for (let i = 0; i < this.nodes.length; i++) {
                this.nodes[i].draw();
            }
        }
    }
    global.Graph = Graph;
}

export { GRAPH };