let CONTROL = (global) => {
    const p5 = global.p5;
    const Vec = global.Vec;
    const Node = global.Node;
    const Edge = global.Edge;
    const Versioning = global.Versioning;
    const viewpoint = global.viewpoint;
    const ResetIcon = global.ResetIcon;
    const EditIcon = global.EditIcon;
    const HelpIcon = global.HelpIcon;
    const GlassIcon = global.GlassIcon;
    const COMPATIBLE = "compatible";
    const UUID = global.UUID;
    const COLORS = global.COLORS;

    let versioning = undefined;
    let id = 0;
    let keyChecks = [];
    let checkInitial = 400;
    let checkFrequency = 40;
    let windowWidth = 0;
    let windowHeight = 0;
    let holding = undefined;
    let howering = [];
    let offset = Vec(0, 0);
    let node = undefined;
    let edge = undefined;
    let editNode = undefined;
    let editEdge = undefined;
    let originalEdge = undefined;
    let originalEditNode = undefined;
    let originalEditEdge = undefined;
    let rdfOffset = undefined;
    let changeViewpoint = false;
    let changeRDFViewpoint = false;
    let reset_icon = undefined;
    let edit_icon = undefined;
    let help_icon = undefined;
    let glass_icon = undefined;
    let levelTextSize = 32;
    let levelTextPadding = Vec(20, 20);
    let levelText = "Lv.1";
    let controls = {
        create_node: [0],
        move_node: [0],
        edit_node: [2],
        delete_node: [1],
        create_edge: [2],
        move_edge: [0],
        edit_edge: [2],
        delete_edge: [1],
        move_graph: [2],
        next: ["ArrowRight"],
        previous: ["ArrowLeft"],
        next_approved: ["ArrowUp", "PageUp"],
        previous_approved: ["ArrowDown", "PageDown"],
        jump_start: ["s"],
        jump_end: ["e"],
        toggle_approval: [2],
        jump_graph: [0],
        enter_edit: ["Enter"],
        delete_char: ["Backspace"],
        escape_edit: ["Escape"],
        cursor_left: ["ArrowLeft"],
        cursor_right: ["ArrowRight"],
        press_button: [0],
        move_rdf_vertical: ["MouseWheel"],
        move_rdf_horizontal: []  // add 0 for manual moving (and modify versioning.rdfResize too)
    };


    p5.setup = () => {
        versioning = new Versioning();
        const canvas = p5.createCanvas(p5.windowWidth, p5.windowHeight);
        windowWidth = p5.windowWidth;
        windowHeight = p5.windowHeight;
        canvas.position(0, 0);
        p5.smooth();
        p5.frameRate(60);
        p5.loadImage('assets/reload.png', img => {
            reset_icon = new ResetIcon(img, Vec(10, 10), 1 / 2.5, 17);
        });
        /* p5.loadImage('assets/edit.png', img => {
            edit_icon = new EditIcon(img, Vec(10, 10), 1 / 3, 20, versioning);
        }); */
        /* p5.loadImage('assets/question.png', img => {
            help_icon = new HelpIcon(img, Vec(10, 10), 1 / 3, 18, versioning);
        }); */
        /*let otherLoadedIcon = undefined;
        const glassIcon = (loadedIcon, isChecked) => {
            if (otherLoadedIcon === undefined) {
                otherLoadedIcon = loadedIcon;
                return;
            }
            let [checked, unchecked] = [loadedIcon, otherLoadedIcon];
            if (isChecked === false) {
                [checked, unchecked] = [unchecked, checked];
            }
            glass_icon = new GlassIcon(unchecked, checked, Vec(10, 10), 1 / 2.6, 18, versioning);
        };
        p5.loadImage('assets/glass_unchecked.png', unchecked => {
            glassIcon(unchecked, false);
        });
        p5.loadImage('assets/glass_checked.png', checked => {
            glassIcon(checked, true);
        });*/
    }

    function isIn(el, ls) {
        for (let i = 0; i < ls.length; i++) {
            if (el === ls[i]) {
                return true;
            }
        }
        return false;
    }

    p5.mousePressed = (event) => {
        set_edit();
        reset();
        const mouse = Vec(p5.mouseX, p5.mouseY);
        const nodes = versioning.selected.nodes;
        const edges = versioning.selected.edges;
        const touching_nodes = versioning.selected.touches_nodes(mouse);
        const touching_edges = versioning.selected.touches_edges(mouse);
        const touching_rdf = versioning.touches_rdf(mouse);
        const touching_versions = versioning.touches_versions(mouse);
        const touching_reset = reset_icon !== undefined && reset_icon.touches(mouse);
        const touching_help = help_icon !== undefined && help_icon.touches(mouse);
        const touching_glass = glass_icon !== undefined && glass_icon.touches(mouse);
        const newest = true;

        if (touching_reset || touching_help || touching_glass) {
        } else if (touching_rdf) {
            if (newest && isIn(event.button, controls.move_rdf_horizontal)) {
                changeRDFViewpoint = true;
                rdfOffset = p5.windowWidth - versioning.rdfWidth - mouse.x;
            }
        } else if (touching_versions.length > 0) {
        } else if (touching_nodes.length > 0) {
            if (isIn(event.button, controls.move_node)) {
                holding = nodes[touching_nodes[touching_nodes.length - 1]];
                offset = holding.pos.minus(mouse).plus(viewpoint[0]);
            } else if (newest && isIn(event.button, controls.create_edge)) {
                const start = nodes[touching_nodes[touching_nodes.length - 1]];
                offset = Vec(0, 0);
                edge = new Edge(undefined,
                    UUID(),
                    COMPATIBLE,
                    start,
                    new Node(undefined, undefined,
                        "",
                        mouse,
                        0));
            }
        } else if (touching_edges.length > 0) {
            if (newest && isIn(event.button, controls.move_edge)) {
                originalEdge = edges[touching_edges[touching_edges.length - 1]];
                originalEdge.visible = false;
                edge = originalEdge.copy();
                edge.id = UUID();
                edge.predecessor = originalEdge.id;
                edge.visible = true;
                const vec = edge.getBorderPoints();
                const relativeMouse = mouse.minus(viewpoint[0]);
                if (relativeMouse.minus(vec[0]).distance() < relativeMouse.minus(vec[1]).distance()) {
                    edge.start = new Node(undefined, undefined, "", mouse, 0);
                } else {
                    edge.end = new Node(undefined, undefined, "", mouse, 0);
                }
                offset = Vec(0, 0);
            }
        } else {
            if (newest && isIn(event.button, controls.create_node)) {
                const text = "Version: 1.0.0\nData: 01101000";
                node = new Node(undefined, UUID(), text, mouse)
                versioning.addNode(node);
            } else if (isIn(event.button, controls.move_graph)) {
                changeViewpoint = true
                offset = viewpoint[0].minus(mouse);
            }
        }
    }

    p5.mouseDragged = () => {
        const mouse = Vec(p5.mouseX, p5.mouseY);
        if (holding !== undefined) {
            holding.setPos(mouse.plus(offset));
        }
        if (edge !== undefined) {
            if (edge.end.id === undefined) {
                edge.end.setPos(mouse.plus(offset));
            } else {
                edge.start.setPos(mouse.plus(offset));
            }
        }
        if (changeViewpoint === true) {
            viewpoint[0] = mouse.plus(offset);
        }
        if (changeRDFViewpoint === true) {
            versioning.rdfWidth = p5.windowWidth - mouse.x - rdfOffset;
            versioning.resize(true);
        }
    }

    p5.mouseWheel = (event) => {
        const mouse = Vec(p5.mouseX, p5.mouseY);
        const touching_rdf = versioning.touches_rdf(mouse);
        if (touching_rdf) {
            if (isIn("MouseWheel", controls.move_rdf_vertical)) {
                versioning.viewpoint.y -= event.delta * 0.2;
            }
        }
    }

    p5.mouseReleased = (event) => {
        const mouse = Vec(p5.mouseX, p5.mouseY);
        const offsetMouse = mouse.plus(offset)
        const newest = true;
        const nodes = versioning.selected.nodes;
        const touching_nodes = versioning.selected.touches_nodes(offsetMouse);
        const edges = versioning.selected.edges;
        const touching_edges = versioning.selected.touches_edges(offsetMouse);
        const versions = versioning.versions;
        const touching_versions = versioning.touches_versions(mouse);
        if (node === undefined) {
            if (holding === undefined) {
                if (edge === undefined) {
                    if (touching_versions.length > 0) {
                        if (isIn(event.button, controls.jump_graph)) {
                            const version = versions[touching_versions[touching_versions.length - 1]];
                            versioning.selected = version.graph;
                        }
                    } else if (reset_icon !== undefined && reset_icon.touches(mouse)) {
                        if (isIn(event.button, controls.press_button)) {
                            reset_all();
                            return;
                        }
                    } else if (glass_icon !== undefined && glass_icon.touches(mouse)) {
                        if (isIn(event.button, controls.press_button)) {
                            versioning.rdfDetail = !versioning.rdfDetail;
                            versioning.viewpoint = Vec(0, 0);
                        }
                    } else if (help_icon !== undefined && help_icon.touches(mouse)) {
                        if (isIn(event.button, controls.press_button)) {
                            // TODO
                        }
                    }
                }
            }
            if (newest && edge !== undefined) {
                if (touching_nodes.length > 0) {
                    if (isIn(event.button, controls.create_edge)) {
                        edge.end = nodes[touching_nodes[touching_nodes.length - 1]];
                        if (edge.start !== edge.end) {
                            versioning.addEdge(edge);
                        }
                    } else if (isIn(event.button, controls.move_edge)) {
                        const other = nodes[touching_nodes[touching_nodes.length - 1]];
                        if (edge.end.id === undefined) {
                            edge.end = other;
                        } else {
                            edge.start = other;
                        }
                        if (edge.start !== edge.end) {
                            console.log(originalEdge, edge)
                            versioning.deleteEdge(originalEdge);
                            versioning.addEdge(edge);
                        }
                    }
                }
            }
            if (touching_versions.length > 0) {
            } else if (touching_nodes.length > 0) {
                if (newest && isIn(event.button, controls.delete_node)) {
                    const node = nodes[touching_nodes[touching_nodes.length - 1]];
                    versioning.deleteNode(node);
                } else if (newest && isIn(event.button, controls.edit_node)) {
                    originalEditNode = nodes[touching_nodes[touching_nodes.length - 1]];
                    if (edge === undefined || edge.start === originalEditNode) {
                        originalEditNode.visible = false;
                        editNode = originalEditNode.copy();
                        editNode.id = UUID();
                        editNode.predecessor = originalEditNode.id;
                        editNode.visibile = true;
                        editNode.text.setEdit(true);
                        editNode.text.setCursor(-1);
                    }
                }
            } else if (touching_edges.length > 0) {
                if (newest && isIn(event.button, controls.delete_edge)) {
                    const edge = edges[touching_edges[touching_edges.length - 1]];
                    versioning.deleteEdge(edge);
                } else if (newest && isIn(event.button, controls.edit_edge)) {
                    originalEditEdge = edges[touching_edges[touching_edges.length - 1]];
                    originalEditEdge.visible = false;
                    editEdge = originalEditEdge.copy();
                    editEdge.id = UUID();
                    editEdge.predecessor = originalEditEdge.id;
                    editEdge.visibile = true;
                    editEdge.text.setEdit(true);
                    editEdge.text.setCursor(-1);
                }
            }
        }
        reset();
    }

    p5.keyPressed = (event) => {
        const metadata = [0, Date.now()];
        const keyCheck = () => {
            if (!p5.keyIsDown(event.keyCode)) {
                return false;
            }
            if (metadata[0] !== 0) {
                if (metadata[0] === 1) {
                    if (Date.now() - metadata[1] < checkInitial) {
                        return true;
                    }
                } else {
                    if (Date.now() - metadata[1] < checkFrequency) {
                        return true;
                    }
                }
            }

            metadata[0]++;
            metadata[1] = Date.now();

            let edit = undefined;
            if (editNode !== undefined) {
                edit = editNode;
            } else if (editEdge !== undefined) {
                edit = editEdge;
            }
            if (edit !== undefined) {
                if (isIn(event.key, controls.delete_char)) {
                    edit.text.deleteChar();
                } else if (isIn(event.key, controls.enter_edit)) {
                    edit.text.insertChar("\n");
                } else if (isIn(event.key, controls.escape_edit)) {
                    set_edit();
                } else if (isIn(event.key, controls.cursor_left)) {
                    edit.text.moveCursor(-1);
                } else if (isIn(event.key, controls.cursor_right)) {
                    edit.text.moveCursor(1);
                } else if (event.key.length === 1) {
                    edit.text.insertChar(event.key);
                }
            }
            return true;
        }
        keyCheck();
        keyChecks = [keyCheck];
    }

    function set_edit() {
        if (editNode !== undefined) {
            if (!editNode.text.equals(originalEditNode.text)) {
                editNode.text.setEdit(false);
                versioning.addNode(editNode);
            }
        }
        if (editEdge !== undefined) {
            if (!editEdge.text.equals(originalEditEdge.text)) {
                editEdge.text.setEdit(false);
                versioning.addEdge(editEdge);
            }
        }
        reset_edit();
    }

    function reset() {
        holding = undefined;
        howering.forEach(h => { h.selected = false });
        howering = [];
        offset = Vec(0, 0);
        node = undefined;
        edge = undefined;
        if (originalEdge !== undefined) {
            originalEdge.visible = true;
            originalEdge = undefined;
        }
        rdfOffset = undefined;
        changeViewpoint = false;
        changeRDFViewpoint = false;
        if (edit_icon !== undefined) {
            edit_icon.versioning = versioning;
        }
        if (help_icon !== undefined) {
            help_icon.versioning = versioning;
        }
        if (glass_icon !== undefined) {
            glass_icon.versioning = versioning;
        }
    }

    function reset_edit() {
        if (editNode !== undefined) {
            if (originalEditNode) {
                originalEditNode.visible = true;
                originalEditNode = undefined;
            }
            editNode = undefined;
        }
        if (editEdge !== undefined) {
            if (originalEditEdge) {
                originalEditEdge.visible = true;
                originalEditEdge = undefined;
            }
            editEdge = undefined;
        }
    }

    function reset_all() {
        id = 0;
        versioning = new Versioning();
        viewpoint[0] = Vec(0, 0);
        reset_edit();
        reset();
    }

    p5.draw = () => {
        const nodes = versioning.selected.nodes;
        const edges = versioning.selected.edges;
        const mouse = Vec(p5.mouseX, p5.mouseY);
        const touching_nodes = versioning.selected.touches_nodes(mouse);
        const touching_edges = versioning.selected.touches_edges(mouse);
        howering.forEach(h => { h.selected = false });
        howering = [];
        touching_nodes.forEach(t => {
            const node = nodes[t];
            node.selected = true;
            howering.push(node);
        });
        if (touching_nodes.length === 0) {
            touching_edges.forEach(t => {
                const edge = edges[t];
                edge.selected = true;
                howering.push(edge);
            });
        }

        if (windowWidth !== p5.windowWidth || windowHeight !== p5.windowHeight) {
            windowWidth = p5.windowWidth;
            windowHeight = p5.windowHeight;
            p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
        }
        p5.background(230, 230, 231);

        versioning.resize();
        versioning.update();
        versioning.draw();

        p5.textAlign(p5.RIGHT, p5.TOP);
        p5.fill(COLORS["black"])
        p5.textSize(levelTextSize);
        p5.noStroke();
        p5.text(levelText, p5.windowWidth - levelTextPadding.x, levelTextPadding.y);

        p5.push();
        p5.translate(viewpoint[0].x, viewpoint[0].y);
        if (editNode !== undefined) {
            editNode.draw();
        }
        if (edge !== undefined) {
            edge.draw();
        }
        if (editEdge !== undefined) {
            editEdge.draw();
        }
        if (edge !== undefined) {
            edge.draw(true);
        }
        if (editEdge !== undefined) {
            editEdge.draw(true);
        }

        p5.pop();

        if (reset_icon !== undefined) {
            reset_icon.draw();
        }
        if (edit_icon !== undefined && versioning.selected.successors.length === 0) {
            edit_icon.draw();
        }
        if (help_icon !== undefined) {
            help_icon.draw();
        }
        if (glass_icon !== undefined) {
            glass_icon.draw();
        }

        const nextKeyChecks = [];
        keyChecks.forEach(keyCheck => {
            if (keyCheck()) {
                nextKeyChecks.push(keyCheck);
            }
        })
        keyChecks = nextKeyChecks;
    }
}

export { CONTROL };