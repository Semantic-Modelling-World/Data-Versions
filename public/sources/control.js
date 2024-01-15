let CONTROL = (global) => {
    const p5 = global.p5;
    const Vec = global.Vec;
    const Node = global.Node;
    const Edge = global.Edge;
    const Graph = global.Graph;
    const ResetIcon = global.ResetIcon;
    const COMPATIBLE = "compatible";
    const PREDECESSOR = "predecessor";
    const SUCCESSOR = "successor";
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
    const canvas = global.canvas;
    const Mat = global.Mat;

    let graph = undefined;
    let keyChecks = [];
    let checkInitial = 400;
    let checkFrequency = 40;
    let windowWidth = 0;
    let windowHeight = 0;
    let holding = undefined;
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
        // create_node: [0],
        move_node: [0],
        edit_node: [2],
        delete_node: [1],
        create_edge: [2],
        // move_edge: [0],
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
        const nodes = graph.nodes;
        const touching_nodes = graph.touches_nodes(mouse);
        // const edges = graph.edges;
        // const touching_edges = graph.touches_edges(mouse);
        const touching_reset = reset_icon !== undefined && reset_icon.touches(mouse);
        const touching_help = help_icon !== undefined && help_icon.touches(mouse);

        if (touching_reset || touching_help) {
        } else if (touching_nodes.length > 0) {
            if (isIn(event.button, controls.move_node)) {
                holding = nodes[touching_nodes[touching_nodes.length - 1]];
                offset = unapplyView(holding.pos).minus(mouse);
                animator.cancel(holding);
            } else if (isIn(event.button, controls.create_edge)) {
                const start = nodes[touching_nodes[touching_nodes.length - 1]];
                offset = Vec(0, 0);
                edge = new Edge(
                    COMPATIBLE,
                    start,
                    {
                        pos: applyView(mouse),
                        width: 0,
                        height: 0,
                        id: global.id++,
                        dummy: true
                    });
            }
            /* } else if (touching_edges.length > 0) {
                 if (isIn(event.button, controls.move_edge)) {
                    originalEdge = edges[touching_edges[touching_edges.length - 1]];
                    originalEdge.visible = false;
                    edge = originalEdge.copy();
                    edge.visible = true;
                    const { start: startBorder, end: endBorder, distance: distance } = edge.getBorderPoints();
                    const relativeMouse = applyView(mouse);
                    const dummy =
                    {
                        pos: mouse,
                        width: 0,
                        height: 0,
                        id: global.id++,
                        dummy: true
                    };
                    if (relativeMouse.minus(startBorder).distance() < relativeMouse.minus(endBorder).distance()) {
                        edge.start = dummy;
                    } else {
                        edge.end = dummy;
                    }
                    offset = Vec(0, 0);
                }*/
        } else {
            /*if (isIn(event.button, controls.create_node)) {
                const text = "Version 1.0.0\nData 00001111\n";
                node = new Node(text, applyView(mouse), true)
                graph.addNode(node);
            } else*/
            if (isIn(event.button, controls.move_graph)) {
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
            if (edge.end.dummy !== undefined) {
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
        const nodes = graph.nodes;
        const touching_nodes = graph.touches_nodes(offsetMouse);
        const edges = graph.edges;
        const touching_edges = graph.touches_edges(offsetMouse);
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
            if (edge !== undefined) {
                if (touching_nodes.length > 0) {
                    if (isIn(event.button, controls.create_edge)) {
                        edge.end = nodes[touching_nodes[touching_nodes.length - 1]];
                        if (edge.start.id !== edge.end.id) {
                            graph.addEdge(edge);
                        }
                    } else if (isIn(event.button, controls.move_edge)) {
                        const other = nodes[touching_nodes[touching_nodes.length - 1]];
                        if (edge.end.dummy !== undefined) {
                            edge.end = other;
                        } else {
                            edge.start = other;
                        }
                        if (edge.start.id !== edge.end.id) {
                            graph.deleteEdge(originalEdge);
                            graph.addEdge(edge);
                        }
                    }
                }
            }
            if (touching_nodes.length > 0) {
                if (isIn(event.button, controls.delete_node)) {
                    const node = nodes[touching_nodes[touching_nodes.length - 1]];
                    graph.deleteNode(node);
                } else if (isIn(event.button, controls.edit_node)) {
                    originalEditNode = nodes[touching_nodes[touching_nodes.length - 1]];
                    const row = originalEditNode.touches_row(offsetMouse);
                    if (edge === undefined || edge.start.id === originalEditNode.id) {
                        originalEditNode.visible = false;
                        editNode = originalEditNode.copy();
                        editNode.visibile = true;
                        editNode.text.setEdit(true);
                        editNode.text.setCursor(0);
                        if (editNode.text.findCursorRepeat("\n", 1, row + 1)) {
                            editNode.text.moveCursor(-1);
                        }
                    }
                }
            } else if (touching_edges.length > 0) {
                if (isIn(event.button, controls.delete_edge)) {
                    const edge = edges[touching_edges[touching_edges.length - 1]];
                    graph.deleteEdge(edge);
                } else if (isIn(event.button, controls.edit_edge)) {
                    originalEditEdge = edges[touching_edges[touching_edges.length - 1]];
                    originalEditEdge.visible = false;
                    editEdge = originalEditEdge.copy();
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

    function spawn_copy(copy, vec) {
        const originalPos = unapplyView(copy.pos);
        const originalView = { ...view };
        const node = copy;
        const ani = new Animation(f => { node.pos = applyView(originalPos, originalView).plus(vec.times(f)) }, node);
        animator.animate.push(ani);
    }

    function set_edit() {
        if (editNode !== undefined) {
            if (!editNode.text.equals(originalEditNode.text)) {
                editNode.text.setEdit(false);
                if (editNode.immutable) {
                    const mainNode = editNode.main;
                    let mainCopy = undefined;
                    if (editNode.id === mainNode.id) {
                        mainCopy = editNode;
                        mainCopy.main = mainCopy;
                    } else {
                        mainCopy = mainNode.copy();
                        mainCopy.text = new Text(UUID());
                    }
                    const subs = mainNode.subs;
                    const subsCopy = [];
                    for (let i = 0; i < subs.length; i++) {
                        if (subs[i].id === editNode.id) {
                            subsCopy.push(editNode);
                        } else {
                            subsCopy.push(subs[i].copy());
                        }
                        subsCopy[i].main = mainCopy;
                    }
                    mainCopy.subs = subsCopy;

                    graph.addNode(mainCopy);
                    const predecessor = new Edge(PREDECESSOR, mainCopy, mainNode);
                    graph.addEdge(predecessor);
                    const successor = new Edge(SUCCESSOR, mainNode, mainCopy);
                    graph.addEdge(successor);

                    const length = 400;
                    let vec = Vec(1, windowHeight / windowWidth);
                    const orth = vec.orthogonal().normalized();
                    const inter = Math.random() - 0.5;
                    vec = vec.normalized().times(1 - inter).plus(orth.times(inter)).normalized().times(length);

                    spawn_copy(mainCopy, vec);


                    for (let i = 0; i < subs.length; i++) {
                        graph.addNode(subsCopy[i]);
                        const subEdge = new Edge(subsCopy[i].edgeText, mainCopy, subsCopy[i]);
                        graph.addEdge(subEdge);
                        spawn_copy(subsCopy[i], vec);
                    }
                } else {
                    originalEditNode.text = editNode.text;
                }
            }
        }
        if (editEdge !== undefined) {
            if (!editEdge.text.equals(originalEditEdge.text)) {
                editEdge.text.setEdit(false);
                graph.addEdge(editEdge);
            }
        }
        reset_edit();
    }

    function reset() {
        holding = undefined;
        offset = Vec(0, 0);
        node = undefined;
        edge = undefined;
        if (originalEdge !== undefined) {
            originalEdge.visible = true;
            originalEdge = undefined;
        }
        changeViewpoint = false;
        if (edit_icon !== undefined) {
            edit_icon.graph = graph;
        }
        if (help_icon !== undefined) {
            help_icon.graph = graph;
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
        graph = new Graph();
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

        const mouse = Vec(p5.mouseX, p5.mouseY);

        for (let i = 0; i < graph.nodes.length; i++) {
            const node = graph.nodes[i];
            node.selected = node.touches(mouse);
        }

        animator.update();

        p5.push();
        Mat.reset();
        p5.translate(p5.windowWidth / 2, p5.windowHeight / 2);
        p5.scale(view.scale);
        p5.translate(-p5.windowWidth / 2, -p5.windowHeight / 2);
        p5.translate(view.viewpoint.x, view.viewpoint.y);
        graph.draw();
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
        Mat.reset();
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

    function startLevel1() {
        reset_all();
        levelText = "Lv.1";
        const text = "Version 1.0.0\nData 00001111";
        const node = new Node(
            text,
            applyView(Vec(windowWidth / 4, windowHeight / 4)))
        node.immutable = true;
        node.main = node;
        graph.addNode(node);
    }

    function startLevel2() {
        reset_all();
        levelText = "Lv.2";
        let text = UUID();
        const uuid = new Node(
            text,
            applyView(Vec(windowWidth / 4, windowHeight / 4)),
            Text.textSize * 2,
            (Text.textSize + Node.textPadding.y * 2) / 2);
        uuid.main = uuid;
        graph.addNode(uuid);

        text = "Data 00001111";
        let distance = Node.minHeight + uuid.height + Text.getWidth(BELONGSTO) * 2;
        const data = new Node(
            text,
            applyView(Vec(windowWidth / 4, windowHeight / 4 + distance)));
        data.main = uuid;
        data.immutable = true;
        data.edgeText = BELONGSTO;
        graph.addNode(data);
        const belongsto = new Edge(BELONGSTO, uuid, data);
        graph.addEdge(belongsto);

        distance = Node.minHeight + uuid.height + Text.getWidth(NAME) * 2.5;
        text = "Sensor Driver";
        const driver = new Node(
            text,
            applyView(Vec(windowWidth / 4 - distance, windowHeight / 4 + distance)),
            Text.textSize * 2,
            (Text.textSize + Node.textPadding.y * 2) / 2);
        driver.main = uuid;
        driver.edgeText = NAME;
        graph.addNode(driver);
        const name = new Edge(NAME, uuid, driver);
        graph.addEdge(name);

        distance = Node.minHeight + uuid.height + Text.getWidth(VERSION) * 2;
        text = "1.0.0"
        const version = new Node(
            text,
            applyView(Vec(windowWidth / 4 + distance, windowHeight / 4 + distance)),
            Text.textSize * 2,
            (Text.textSize + Node.textPadding.y * 2) / 2);
        version.main = uuid;
        version.edgeText = VERSION;
        graph.addNode(version);
        const versionEdge = new Edge(VERSION, uuid, version);
        graph.addEdge(versionEdge);

        uuid.subs = [data, driver, version];
    }

    p5.setup = () => {
        canvas.position(0, 0);
        p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
        p5.smooth();
        p5.frameRate(60);
        p5.loadImage('assets/reload.png', img => {
            reset_icon = new ResetIcon(img, Vec(10, 10), 1 / 2.5, 17);
        });
    }

    startLevel1();
}

export { CONTROL };