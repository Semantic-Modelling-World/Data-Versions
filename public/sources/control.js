let CONTROL = (global) => {
    const p5 = global.p5;
    const Vec = global.Vec;
    const Node = global.Node;
    const Edge = global.Edge;
    const Versioning = global.Versioning;
    const ResetIcon = global.ResetIcon;
    const COMPATIBLE = "compatible";
    const PREDECESSOR = "predecessor";
    const BELONGSTO = "belongs to";
    const NAME = "name";
    const VERSION = "version";
    const UUID = global.UUID;
    const COLORS = global.COLORS;
    const Animation = global.Animation;
    const animator = global.animator;
    const view = global.view;
    const applyView = global.applyView;
    const unapplyView = global.unapplyView;
    const TwoD = global.TwoD
    const Text = global.Text;

    let versioning = undefined;
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
    let changeViewpoint = false;
    let reset_icon = undefined;
    let edit_icon = undefined;
    let help_icon = undefined;
    let levelTextSize = 32;
    let levelTextPadding = Vec(20, 20);
    let levelText = "Lv.1";
    let controls = {
        create_node: [], // 0
        move_node: [0],
        edit_node: [2],
        delete_node: [1],
        create_edge: [2],
        move_edge: [0],
        edit_edge: [2],
        delete_edge: [1],
        move_graph: [2],
        enter_edit: ["Enter"],
        delete_char: ["Backspace"],
        escape_edit: ["Escape"],
        cursor_left: ["ArrowLeft"],
        cursor_right: ["ArrowRight"],
        cursor_up: ["ArrowUp"],
        cursor_down: ["ArrowDown"],
        cursor_end_line: ["ShiftRight"],
        cursor_start_line: ["ShiftLeft"],
        cursor_next_word: ["ControlRight"],
        cursor_last_word: ["ControlLeft"],
        press_button: [0],
        zoom: ["MouseWheel"]
    };


    p5.setup = () => {
        const canvas = p5.createCanvas(p5.windowWidth, p5.windowHeight);
        canvas.position(0, 0);
        p5.smooth();
        p5.frameRate(60);
        p5.loadImage('assets/reload.png', img => {
            reset_icon = new ResetIcon(img, Vec(10, 10), 1 / 2.5, 17);
        });
        startLevel1();
    }

    function startLevel1() {
        reset_all();
        levelText = "Lv.1";
        const text = "Version 1.0.0\nData 00001111";
        const node = new Node(
            undefined,
            UUID(),
            text,
            applyView(Vec(windowWidth / 4, windowHeight / 4)),
            true)
        versioning.addNode(node);
    }

    function startLevel2() {
        reset_all();
        levelText = "Lv.2";
        let text = UUID();
        const uuid = new Node(
            undefined,
            UUID(),
            text,
            applyView(Vec(windowWidth / 4, windowHeight / 4)),
            false,
            Text.textSize * 2,
            (Text.textSize + Node.textPadding.y * 2) / 2)
        versioning.addNode(uuid);

        text = "Version 1.0.0\nData 00001111";
        let distance = Node.minHeight + uuid.height + Text.getWidth(BELONGSTO) * 2;
        const data = new Node(
            undefined,
            UUID(),
            text,
            applyView(Vec(windowWidth / 4, windowHeight / 4 + distance)),
            true)
        versioning.addNode(data);
        const belongsto = new Edge(undefined, UUID(), BELONGSTO, uuid, data);
        versioning.addEdge(belongsto);

        distance = Node.minHeight + uuid.height + Text.getWidth(NAME) * 2.5;
        text = "Sensor Driver";
        const driver = new Node(
            undefined,
            UUID(),
            text,
            applyView(Vec(windowWidth / 4 - distance, windowHeight / 4 + distance)),
            false,
            Text.textSize * 2,
            (Text.textSize + Node.textPadding.y * 2) / 2)
        versioning.addNode(driver);
        const name = new Edge(undefined, UUID(), NAME, uuid, driver);
        versioning.addEdge(name);

        distance = Node.minHeight + uuid.height + Text.getWidth(VERSION) * 2;
        text = "1.0.0";
        const version = new Node(
            undefined,
            UUID(),
            text,
            applyView(Vec(windowWidth / 4 + distance, windowHeight / 4 + distance)),
            false,
            Text.textSize * 2,
            (Text.textSize + Node.textPadding.y * 2) / 2)
        versioning.addNode(version);
        const versionEdge = new Edge(undefined, UUID(), VERSION, uuid, version);
        versioning.addEdge(versionEdge);
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
        const ignoreInstruction = editNode !== undefined && isIn(event.button, controls.edit_node);
        set_edit();
        reset();
        if (ignoreInstruction) {
            return;
        }
        const mouse = Vec(p5.mouseX, p5.mouseY);
        const nodes = versioning.selected.nodes;
        const edges = versioning.selected.edges;
        const touching_nodes = versioning.selected.touches_nodes(mouse);
        const touching_edges = versioning.selected.touches_edges(mouse);
        const touching_reset = reset_icon !== undefined && reset_icon.touches(mouse);
        const touching_help = help_icon !== undefined && help_icon.touches(mouse);
        const newest = true;

        if (touching_reset || touching_help) {
        } else if (touching_nodes.length > 0) {
            if (isIn(event.button, controls.move_node)) {
                holding = nodes[touching_nodes[touching_nodes.length - 1]];
                offset = unapplyView(holding.pos).minus(mouse);
                animator.cancel(holding);
            } else if (newest && isIn(event.button, controls.create_edge)) {
                const start = nodes[touching_nodes[touching_nodes.length - 1]];
                offset = Vec(0, 0);
                edge = new Edge(undefined,
                    UUID(),
                    COMPATIBLE,
                    start,
                    new Node(undefined, undefined,
                        "",
                        applyView(mouse),
                        false,
                        0,
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
                const { start: startBorder, end: endBorder, distance: distance } = edge.getBorderPoints();
                const relativeMouse = applyView(mouse);
                if (relativeMouse.minus(startBorder).distance() < relativeMouse.minus(endBorder).distance()) {
                    edge.start = new Node(undefined, undefined, "", applyView(mouse), false, 0, 0);
                } else {
                    edge.end = new Node(undefined, undefined, "", applyView(mouse), false, 0, 0);
                }
                offset = Vec(0, 0);
            }
        } else {
            if (newest && isIn(event.button, controls.create_node)) {
                const text = "Version 1.0.0\nData 00001111\n";
                node = new Node(undefined, UUID(), text, applyView(mouse), true)
                versioning.addNode(node);
            } else if (isIn(event.button, controls.move_graph)) {
                changeViewpoint = true
                offset = view.viewpoint.times(view.scale).minus(mouse);
            }
        }
    }

    p5.mouseDragged = () => {
        const mouse = Vec(p5.mouseX, p5.mouseY);
        if (holding !== undefined) {
            holding.pos = applyView(mouse.plus(offset));
        }
        if (edge !== undefined) {
            if (edge.end.id === undefined) {
                edge.end.pos = applyView(mouse.plus(offset));
            } else {
                edge.start.pos = applyView(mouse.plus(offset));
            }
        }
        if (changeViewpoint === true) {
            view.viewpoint = mouse.plus(offset).times(1 / view.scale);
        }
    }

    p5.mouseWheel = (event) => {
        if (isIn("MouseWheel", controls.zoom)) {
            view.scale = Math.min(3, Math.max(0.3, view.scale - event.delta * 0.0002));
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
        if (node === undefined) {
            if (holding === undefined) {
                if (edge === undefined) {
                    if (reset_icon !== undefined && reset_icon.touches(mouse)) {
                        if (isIn(event.button, controls.press_button)) {
                            startLevel1();
                            return;
                        }
                    } else if (help_icon !== undefined && help_icon.touches(mouse)) {
                        if (isIn(event.button, controls.press_button)) {
                            // TODO
                        }
                    } else {
                        p5.textSize(levelTextSize);
                        p5.noStroke();
                        const w = p5.textWidth(levelText);
                        const h = levelTextSize;
                        const p2 = Vec(p5.windowWidth - levelTextPadding.x, levelTextPadding.y);
                        const p1 = p2.plus(Vec(-w, 0));
                        const p3 = p2.plus(Vec(0, h));
                        const p4 = p2.plus(Vec(-w, h));
                        if (TwoD.pointIntersectRect(mouse, p1, p2, p3, p4)) {
                            return startLevel2();
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
                            versioning.deleteEdge(originalEdge);
                            versioning.addEdge(edge);
                        }
                    }
                }
            }
            if (touching_nodes.length > 0) {
                if (newest && isIn(event.button, controls.delete_node)) {
                    const node = nodes[touching_nodes[touching_nodes.length - 1]];
                    versioning.deleteNode(node);
                } else if (newest && isIn(event.button, controls.edit_node)) {
                    originalEditNode = nodes[touching_nodes[touching_nodes.length - 1]];
                    const row = originalEditNode.touches_row(offsetMouse);
                    if (edge === undefined || edge.start === originalEditNode) {
                        originalEditNode.visible = false;
                        editNode = originalEditNode.copy();
                        editNode.id = UUID();
                        editNode.predecessor = originalEditNode.id;
                        editNode.visibile = true;
                        editNode.text.setEdit(true);
                        editNode.text.setCursor(0);
                        if (editNode.text.findCursorRepeat("\n", 1, row + 1)) {
                            editNode.text.moveCursor(-1);
                        }
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
                } else if (isIn(event.key, controls.cursor_up)) {
                    edit.text.moveCursor(-1);
                    edit.text.findCursor("\n", -1);
                } else if (isIn(event.key, controls.cursor_down)) {
                    edit.text.moveCursor(1);
                    edit.text.findCursor("\n", 1);
                } else if (isIn(event.key, controls.cursor_start_line)) {
                    // TODO
                } else if (isIn(event.key, controls.cursor_end_line)) {
                    // TODO
                } else if (isIn(event.key, controls.cursor_last_word)) {
                    // TODO
                } else if (isIn(event.key, controls.cursor_next_word)) {
                    // TODO
                } else if (event.key.length === 1) {
                    edit.text.insertChar(event.key);
                }
            }
            return true;
        }
        keyCheck();
        keyChecks = [keyCheck];
    }

    function spawn_child(parent, child, vec) {
        const originalPos = unapplyView(child.pos);
        const originalView = { ...view };
        const node = child;
        const ani = new Animation(f => { node.pos = applyView(originalPos, originalView).plus(vec.times(f)) }, node);
        animator.animate.push(ani);
    }

    function set_edit() {
        if (editNode !== undefined) {
            if (!editNode.text.equals(originalEditNode.text)) {
                editNode.text.setEdit(false);
                if (editNode.immutable) {
                    versioning.addNode(editNode);
                    const newEdge = new Edge(undefined, UUID(), PREDECESSOR, originalEditNode, editNode);
                    versioning.addEdge(newEdge);

                    const length = Math.max(editNode.width, editNode.height) + Math.max(originalEditNode.width, originalEditNode.height) + newEdge.text.getSize().x + 20;
                    let vec = Vec(1, windowHeight / windowWidth);
                    const orth = vec.orthogonal().normalized();
                    const inter = Math.random() - 0.5;
                    vec = vec.normalized().times(1 - inter).plus(orth.times(inter)).normalized().times(length);

                    spawn_child(originalEditNode, editNode, vec);
                } else {
                    originalEditNode.text = editNode.text;
                }
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
        changeViewpoint = false;
        if (edit_icon !== undefined) {
            edit_icon.versioning = versioning;
        }
        if (help_icon !== undefined) {
            help_icon.versioning = versioning;
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
        windowWidth = p5.windowWidth;
        windowHeight = p5.windowHeight;
        versioning = new Versioning();
        animator.clear();
        view.alpha = 255;
        view.viewpoint = Vec(0, 0);
        view.scale = 1;
        reset_edit();
        reset();
    }

    p5.draw = () => {
        p5.background(230, 230, 231);
        if (windowWidth !== p5.windowWidth || windowHeight !== p5.windowHeight) {
            windowWidth = p5.windowWidth;
            windowHeight = p5.windowHeight;
            p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
        }

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

        animator.update();

        p5.push();
        p5.translate(p5.windowWidth / 2, p5.windowHeight / 2);
        p5.scale(view.scale);
        p5.translate(-p5.windowWidth / 2, -p5.windowHeight / 2);
        p5.translate(view.viewpoint.x, view.viewpoint.y);
        versioning.selected.draw();
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
        if (editNode !== undefined) {
            editNode.draw();
        }
        p5.pop();

        p5.textAlign(p5.RIGHT, p5.TOP);
        p5.fill(COLORS["black"])
        p5.textSize(levelTextSize);
        p5.noStroke();
        p5.text(levelText, p5.windowWidth - levelTextPadding.x, levelTextPadding.y);

        if (reset_icon !== undefined) {
            reset_icon.draw();
        }
        if (help_icon !== undefined) {
            help_icon.draw();
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