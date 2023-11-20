const VERSIONING = (global) => {
    const p5 = global.p5;
    const Vec = global.Vec;
    const COLORS = global.COLORS;
    const UUID = global.UUID;
    const Node = global.Node;
    const Edge = global.Edge;
    const Graph = global.Graph;
    const alpha = global.alpha;
    const viewpoint = global.viewpoint;
    const RDF = global.RDF;

    class Animation {
        static threshold = 0.999999;
        static speed = 0.01;
        constructor(start, end, func) {
            this.start = start;
            this.end = end;
            this.vec = this.end.minus(this.start);
            this.time = Date.now();
            this.func = func;
        }

        update() {
            const t = (Date.now() - this.time) * Animation.speed;
            const f = (1 - 1 / Math.pow(2, t));
            if (f < Animation.threshold) {
                this.func(this.vec.times(f).plus(this.start));
                return true;
            }
            this.func(this.end);
            return false;
        }

        force() {
            this.func(this.end);
        }
    }


    class Version {
        static r = 15;
        static textWidth = 20;
        static offset = Version.r / 1.5 + Version.r;
        constructor(graph, pos) {
            this.graph = graph;
            this.setPos(pos);
            this.selected = false;
            this.strokeWeight = 1;
        }

        setPos(pos) {
            this.pos = pos;
        }

        touches(pos) {
            return this.pos.minus(pos).distance() <= Version.r;
        }

        draw() {
            p5.noStroke();
            if (this.graph.approval) {
                p5.fill(COLORS["mediumOrange"]);
            } else {
                p5.fill(COLORS["mediumBlue"]);
            }
            p5.ellipse(this.pos.x, this.pos.y, Version.r * 2, Version.r * 2);

            p5.noStroke();
            p5.textSize(Version.textWidth);
            p5.textAlign(p5.CENTER, p5.CENTER);
            p5.fill(COLORS["black"]);
            p5.text(this.graph.id, this.pos.x, this.pos.y - Version.offset);
        }
    }


    class Versioning {
        constructor() {
            this.counter = 0;
            this.selected = undefined;

            // 2D
            this.height = 5;
            this.offset = 50;

            // animation
            this.animate = [];
            this.animateRDF = undefined;
            this.versions = [];
            this.index = 0;
            this.spacing = 100;
            this.oldWindowWidth = -1;
            this.oldWindowHeight = -1;

            // RDF
            this.rdfWidth = p5.windowWidth * 0.3;
            this.maxRelativeRDFWidth = 0.5;
            this.textWidth = 15;
            this.textSpacing = 5;
            this.viewpoint = Vec(0, 0);
            this.captionSize = 15;
            this.dividerSize = 1;
            this.rdfDetail = false;

            this.addGraph([], []);
            this.resize(true);
            this.force();
            this.resizeTimeline();
            this.force();
        }

        rdf() {
            return this.rdfDetail ? this.selected.totalRDF : this.selected.rdf;
        }

        next(index, approval = false) {
            let changed = false;
            while (index < this.selected.successors.length) {
                changed = true;
                this.selected = this.selected.successors[index];
                this.resizeTimeline();
                if (this.selected.approval === true || approval === false) {
                    break;
                }
            }
            return changed;
        }

        previous(approval = false) {
            let changed = false;
            while (this.selected.predecessor !== undefined) {
                changed = true;
                this.selected = this.selected.predecessor;
                this.resizeTimeline();
                if (this.selected.approval === true || approval === false) {
                    break;
                }
            }
            return changed;
        }

        addGraph(nodes, edges) {
            if (this.selected !== undefined && this.selected.successors.length > 0) {
                return;
            }
            this.selected = new Graph(this.selected, UUID(), nodes, edges);
            const width = p5.windowWidth - this.rdfWidth;
            const height = p5.windowHeight;
            const startX = width / 2;
            const outside = Vec(startX, height + Version.offset + Version.textWidth);
            this.versions.push(new Version(this.selected, outside));
            this.resizeTimeline();
        }

        addNode(label, pos) {
            const nodes = this.selected.nodes.slice();
            const node = new Node(undefined, UUID(), label, pos);
            nodes.push(node);
            this.addGraph(nodes, this.selected.edges.slice());
            return node;
        }

        deleteNode(node) {
            const nodes = this.selected.nodes.slice();
            const new_nodes = [];
            const edges = this.selected.edges.slice();
            const new_edges = [];
            for (let i = 0; i < nodes.length; i++) {
                if (node.id !== nodes[i].id) {
                    new_nodes.push(nodes[i]);
                }
            }
            for (let i = 0; i < edges.length; i++) {
                if (node.id !== edges[i].start.id && node.id !== edges[i].end.id) {
                    new_edges.push(edges[i]);
                }
            }
            this.addGraph(new_nodes, new_edges);
        }

        addEdge(label, start, end) {
            const edges = this.selected.edges.slice();
            const edge = new Edge(undefined, UUID(), label, start, end);
            for (let i = 0; i < edges.length; i++) {
                if (start.id === edges[i].start.id && end.id === edges[i].end.id) {
                    return;
                }
            }
            edges.push(edge);
            this.addGraph(this.selected.nodes.slice(), edges);
        }

        deleteEdge(edge) {
            const edges = this.selected.edges.slice();
            const new_edges = [];
            for (let i = 0; i < edges.length; i++) {
                if (edge.id !== edges[i].id) {
                    new_edges.push(edges[i]);
                }
            }
            this.addGraph(this.selected.nodes.slice(), new_edges);
        }

        modifyNode(node) {
            const nodes = [];
            let change = false;
            let new_node = undefined;
            this.selected.nodes.forEach(n => {
                if (n.id === node.id && n.label !== node.label) {
                    change = true;
                    new_node = new Node(n, UUID(), node.label, node.pos.plus(viewpoint[0]));
                    nodes.push(new_node);
                } else {
                    nodes.push(n);
                }
            });
            if (change === false) {
                return;
            }
            const edges = [];
            this.selected.edges.forEach(edge => {
                if (edge.start.id === node.id && edge.end.id === node.id) {
                    edges.push(new Edge(edge, UUID(), edge.label, new_node, new_node));
                } else if (edge.start.id === node.id) {
                    edges.push(new Edge(edge, UUID(), edge.label, new_node, edge.end));
                } else if (edge.end.id === node.id) {
                    edges.push(new Edge(edge, UUID(), edge.label, edge.start, new_node));
                } else {
                    edges.push(edge);
                }
            });
            this.addGraph(nodes, edges);
        }

        modifyEdge(edge) {
            const edges = [];
            let change = false;
            for (let i = 0; i < this.selected.edges.length; i++) {
                const e = this.selected.edges[i];
                if (edge.id !== e.id && edge.start.id === e.start.id && edge.end.id === e.end.id) {
                    return;
                }
                if (edge.id === e.id && (edge.label !== e.label || edge.start.id !== e.start.id || edge.end.id !== e.end.id)) {
                    edges.push(new Edge(e, UUID(), edge.label, edge.start, edge.end));
                    change = true;
                } else {
                    edges.push(e);
                }
            };
            if (change === false) {
                return;
            }
            this.addGraph(this.selected.nodes.slice(), edges);
        }

        resizeTimeline() {
            this.animate = [];
            const rdfWidth = this.animateRDF === undefined ? this.rdfWidth : this.animateRDF.end.x;
            const width = p5.windowWidth - rdfWidth;
            const height = p5.windowHeight;
            const startY = height - this.height - this.offset;
            for (let i = 0; i < this.versions.length; i++) {
                const v = this.versions[this.versions.length - 1 - i];
                const end = Vec(width / 2 + this.spacing * (this.versions.length - 1 - this.selected.index - i), startY);
                this.animate.push(new Animation(v.pos, end, pos => v.setPos(pos)));
            }
        }

        update() {
            const animate = [];
            this.animate.forEach(ani => {
                if (ani.update()) {
                    animate.push(ani);
                }
            });
            this.animate = animate;
            if (this.animateRDF !== undefined) {
                if (!this.animateRDF.update()) {
                    this.animateRDF = undefined;
                }
            }
        }

        force() {
            this.animate.forEach(ani => {
                ani.force();
            });
            if (this.animateRDF !== undefined) {
                this.animateRDF.force();
                this.animateRDF = undefined;
            }
        }

        resize(changed = false) {
            p5.textSize(RDF.captionSize);
            const minX = p5.textWidth(RDF.caption) + 4 * RDF.xSpacing;
            const maxX = this.maxRelativeRDFWidth * p5.windowWidth;
            const [x, y] = this.rdf().draw(0, 0, 0, 0, Vec(0, 0), true);
            const rdfWidth = this.animateRDF === undefined ? this.rdfWidth : this.animateRDF.end.x;
            const newRDFWidth = Math.min(maxX, Math.max(minX, x + 5 * RDF.xSpacing));
            // const newRDFWidth = Math.min(maxX, Math.max(minX, this.rdfWidth));  // Move RDF window manually
            this.viewpoint.y = Math.min(0, Math.max(p5.windowHeight - y, this.viewpoint.y));
            this.viewpoint.x = 0;
            if (changed || rdfWidth !== newRDFWidth) {
                this.animateRDF = new Animation(Vec(this.rdfWidth, 0), Vec(newRDFWidth, 0), pos => { this.rdfWidth = pos.x; });
                this.resizeTimeline();
            }
            const width = p5.windowWidth;
            const height = p5.windowHeight;
            if (this.oldWindowWidth !== width || this.oldWindowHeight !== height) {
                this.oldWindowWidth = width;
                this.oldWindowHeight = height;
                this.resizeTimeline();
            }
        }

        draw() {
            p5.push();
            p5.translate(viewpoint[0].x, viewpoint[0].y);
            let predecessor = this.selected.predecessor;
            const decrease = 1.4;
            const scale_decrease = 0.9;
            let alpha_ = 50;
            let scale = scale_decrease;
            let data = [];
            while (predecessor !== undefined && alpha_ >= 1) {
                data.push([predecessor, alpha_, scale]);
                predecessor = predecessor.predecessor;
                alpha_ /= decrease;
                scale *= scale_decrease;
            }
            const width = p5.windowWidth - this.rdfWidth - viewpoint[0].x * 2;
            const height = p5.windowHeight - viewpoint[0].y * 2;
            for (let i = data.length - 1; i >= 0; i--) {
                p5.push();
                const [predecessor, alpha_, scale] = data[i];
                alpha[0] = alpha_;
                p5.translate(width / 2 * (1 - scale), height / 2 * (1 - scale));
                p5.scale(scale, scale);
                predecessor.draw();
                p5.pop();
            }
            alpha[0] = 255;
            this.selected.draw();
            p5.pop();
            this.drawTimeLine();
            this.drawRDF();
        }

        drawTimeLine() {
            const width = p5.windowWidth - this.rdfWidth;
            const height = p5.windowHeight;
            const startY = height - this.height - this.offset;
            p5.noStroke();
            p5.fill(COLORS["lightGrey"]);
            p5.rect(0, startY - this.height / 2, p5.windowWidth, this.height);
            this.versions.forEach(version => version.draw());
            p5.noStroke();
            p5.fill(COLORS["lightGrey"]);
            p5.ellipse(width / 2, startY, Version.r / 2, Version.r / 2);
        }

        drawRDF() {
            this.rdf().draw(p5.windowWidth - this.rdfWidth, 0, this.rdfWidth, p5.windowHeight, this.viewpoint);
        }

        touches_rdf(pos) {
            const startX = p5.windowWidth - this.rdfWidth;
            return pos.x >= startX && pos.y >= 0 && pos.x <= p5.windowWidth && pos.y <= p5.windowHeight;
        }

        touches_versions(pos) {
            let touching = [];
            for (let i = 0; i < this.versions.length; i++) {
                if (this.versions[i].touches(pos)) {
                    touching.push(i);
                }
            }
            return touching;
        }
    }
    global.Versioning = Versioning;
}

export { VERSIONING };