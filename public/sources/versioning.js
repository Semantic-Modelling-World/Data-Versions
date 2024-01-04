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
    const Animation = global.Animation;

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

            // RDF
            this.rdfWidth = 0; // p5.windowWidth * 0.3;
            this.maxRelativeRDFWidth = 0.5;
            this.textWidth = 15;
            this.textSpacing = 5;
            this.rdfviewpoint = Vec(0, 0);
            this.captionSize = 15;
            this.dividerSize = 1;
            this.rdfDetail = false;

            this.setGraph([], []);
        }

        rdf() {
            return this.rdfDetail ? this.selected.totalRDF : this.selected.rdf;
        }

        setGraph(nodes, edges) {
            if (this.selected === undefined) {
                this.selected = new Graph(undefined, UUID(), nodes, edges);
            }
            this.selected = new Graph(this.selected, UUID(), nodes, edges);
        }

        addNode(node) {
            const nodes = this.selected.nodes.slice();
            nodes.push(node);
            this.setGraph(nodes, this.selected.edges);
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
            this.setGraph(new_nodes, new_edges);
        }

        addEdge(edge) {
            const edges = this.selected.edges.slice();
            const newEdges = []
            for (let i = 0; i < edges.length; i++) {
                if (edge.start.id === edges[i].start.id && edge.end.id === edges[i].end.id) {
                    continue;
                }
                newEdges.push(edges[i]);
            }
            newEdges.push(edge);
            this.setGraph(this.selected.nodes.slice(), newEdges);
        }

        deleteEdge(edge) {
            const edges = this.selected.edges.slice();
            const newEdges = [];
            for (let i = 0; i < edges.length; i++) {
                if (edge.id !== edges[i].id) {
                    newEdges.push(edges[i]);
                }
            }
            this.setGraph(this.selected.nodes.slice(), newEdges);
        }

        draw() {
            p5.push();
            p5.translate(viewpoint.value.x, viewpoint.value.y);
            alpha.value = 255;
            this.selected.draw();
            p5.pop();
            // this.drawRDF();
        }

        drawRDF() {
            this.rdf().draw(p5.windowWidth - this.rdfWidth, 0, this.rdfWidth, p5.windowHeight, this.rdfviewpoint);
        }

        touches_rdf(pos) {
            const startX = p5.windowWidth - this.rdfWidth;
            return pos.x >= startX && pos.y >= 0 && pos.x <= p5.windowWidth && pos.y <= p5.windowHeight;
        }
    }
    global.Versioning = Versioning;
}

export { VERSIONING };