const VERSIONING = (global) => {
    const p5 = global.p5;
    const Vec = global.Vec;
    const UUID = global.UUID;
    const Graph = global.Graph;
    const view = global.view;

    class Versioning {
        constructor() {
            this.counter = 0;
            this.selected = undefined;

            this.height = 5;
            this.offset = 50;
            this.zoom = 1;

            this.textWidth = 15;
            this.textSpacing = 5;
            this.captionSize = 15;
            this.dividerSize = 1;

            this.setGraph([], []);
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
        }
    }
    global.Versioning = Versioning;
}

export { VERSIONING };