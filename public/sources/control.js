let CONTROL = (exp) => {
    const p5 = exp.p5;
    const Vec = exp.Vec;
    const Node = exp.Node;
    const Edge = exp.Edge;
    const Graph = exp.Graph;
    const Text = exp.Text;
    const CircleButton = exp.CircleButton;
    const SquareButton = exp.SquareButton;
    const UUID = exp.UUID;
    const hash = exp.hash;
    const COLORS = exp.COLORS;
    const Animation = exp.Animation;
    const animator = exp.animator;
    const canvas = exp.canvas;
    const view = exp.view;
    const applyView = exp.applyView;
    const unapplyView = exp.unapplyView;

    const PREDECESSOR = "predecessor";
    const SUCCESSOR = "successor";
    const BELONGSTO = "belongs to";
    const LABEL = "label";
    const VERSION = "version";

    let graph = undefined;
    let windowWidth = 0;
    let windowHeight = 0;

    let keyChecks = [];
    let checkInitial = 400;
    let checkFrequency = 40;

    let draggedNode = undefined;
    let mouseOffset = Vec(0, 0);
    let editNode = undefined;
    let oldEditNode = undefined;
    let changeViewpoint = false;

    let reset_button = undefined;
    let reset_pos = undefined;
    let help_button = undefined;
    let help_pos = undefined;
    let right_arrow_button = undefined;
    let right_arrow_pos = undefined;
    let left_arrow_button = undefined;
    let left_arrow_pos = undefined;
    let levelTextSize = 32;
    let levelTextPadding = Vec(20, 20);
    let levelText = "Lv.";
    let level = "1";
    const helpText = "- Move Nodes with Left Click\n- Edit nodes with Right Click\n- Complete editing with Escape\n- Zoom with the Mouse Wheel\n- Move around with Left Click";
    let helpNode = new Node(helpText, undefined, COLORS["lightGrey"]);
    let helpNodeSettings = { pos: Vec(0, 0), alpha: 200, visible: false };
    let oldHelpNodeSettings = { ...helpNodeSettings };

    let controls = {
        move_node: [0],
        edit_node: [2],
        move_graph: [0],
        enter_edit: ["Enter"],
        delete_char: ["Backspace"],
        escape_edit: ["Escape"],
        cursor_left: ["ArrowLeft"],
        cursor_right: ["ArrowRight"],
        cursor_up: ["ArrowUp"],
        cursor_down: ["ArrowDown"],
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
        const mouse = Vec(p5.mouseX, p5.mouseY);
        const nodes = graph.nodes;
        const touching_nodes = graph.touches_nodes(mouse);
        if (isIn(event.button, controls.edit_node) && editNode !== undefined && editNode.touches(mouse)) {
            const textPos = editNode.pos.plus(Node.textPadding);
            editNode.text.setCursorByPoint(textPos.x, textPos.y, mouse);
            return;
        }
        complete_node_editing();

        if ((reset_button !== undefined && reset_button.touches(reset_pos(), mouse)) ||
            (right_arrow_button !== undefined && right_arrow_button.touches(right_arrow_pos(), mouse)) ||
            (left_arrow_button !== undefined && left_arrow_button.touches(left_arrow_pos(), mouse)) ||
            (help_button !== undefined && help_button.touches(help_pos(), mouse))) {
        } else if (touching_nodes.length > 0) {
            if (isIn(event.button, controls.move_node)) {
                draggedNode = nodes[touching_nodes[touching_nodes.length - 1]];
                mouseOffset = unapplyView(draggedNode.pos).minus(mouse);
                animator.cancel(draggedNode);
            } else if (isIn(event.button, controls.edit_node)) {
                editNode = nodes[touching_nodes[touching_nodes.length - 1]];
                if (editNode.visible && editNode.editable) {
                    oldEditNode = editNode.copy();
                    editNode.text.setEditMode(true);
                    const textPos = editNode.pos.plus(Node.textPadding);
                    editNode.text.setCursorByPoint(textPos.x, textPos.y, mouse);
                } else {
                    editNode = undefined;
                }
            }
        } else {
            if (isIn(event.button, controls.move_graph)) {
                changeViewpoint = true
                mouseOffset = view.viewpoint.times(view.scale).minus(mouse);
            }
        }
    }

    p5.mouseDragged = () => {
        const mouse = Vec(p5.mouseX, p5.mouseY);
        if (draggedNode !== undefined) {
            draggedNode.pos = applyView(mouse.plus(mouseOffset));
        }
        if (changeViewpoint === true) {
            view.viewpoint = mouse.plus(mouseOffset).times(1 / view.scale);
        }
    }

    p5.mouseWheel = (event) => {
        if (isIn("MouseWheel", controls.zoom)) {
            view.scale = Math.min(3, Math.max(0.3, view.scale - event.delta * 0.0002));
        }
    }

    p5.mouseReleased = (event) => {
        abort_dragging();
        const mouse = Vec(p5.mouseX, p5.mouseY);
        if (draggedNode === undefined) {
            if (reset_button !== undefined && reset_button.touches(reset_pos(), mouse)) {
                if (isIn(event.button, controls.press_button)) {
                    if (level === "1") {
                        return startLevel1();
                    } else if (level === "2") {
                        return startLevel2();
                    } else if (level === "3") {
                        return startLevel3();
                    } else if (level === "4") {
                        return startLevel4();
                    }
                }
            } else if (help_button !== undefined && help_button.touches(help_pos(), mouse)) {
                if (isIn(event.button, controls.press_button)) {
                    helpNodeSettings.visible = !helpNodeSettings.visible;
                }
            } else if (right_arrow_button !== undefined && right_arrow_button.touches(right_arrow_pos(), mouse)) {
                if (isIn(event.button, controls.press_button)) {
                    if (level === "1") {
                        return startLevel2();
                    } else if (level === "2") {
                        return startLevel3();
                    } else if (level === "3") {
                        return startLevel4();
                    } else if (level === "4") {
                        return startLevel1();
                    }
                }
            } else if (left_arrow_button !== undefined && left_arrow_button.touches(left_arrow_pos(), mouse)) {
                if (isIn(event.button, controls.press_button)) {
                    if (level === "1") {
                        return startLevel4();
                    } else if (level === "2") {
                        return startLevel1();
                    } else if (level === "3") {
                        return startLevel2();
                    } else if (level === "4") {
                        return startLevel3();
                    }
                }
            }
        }
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
                edit = editNode.text;
            }
            if (edit !== undefined) {
                if (isIn(event.key, controls.delete_char)) {
                    edit.deleteChar();
                } else if (isIn(event.key, controls.enter_edit)) {
                    edit.insertChar("\n");
                } else if (isIn(event.key, controls.escape_edit)) {
                    complete_node_editing();
                } else if (isIn(event.key, controls.cursor_left)) {
                    edit.moveCursor(-1);
                } else if (isIn(event.key, controls.cursor_right)) {
                    edit.moveCursor(1);
                } else if (isIn(event.key, controls.cursor_up)) {
                    edit.move2DCursor(0, -1);
                } else if (isIn(event.key, controls.cursor_down)) {
                    edit.move2DCursor(0, 1);
                } else if (event.key.length === 1) {
                    edit.insertChar(event.key);
                }
            }
            return true;
        }
        keyCheck();
        keyChecks = [keyCheck];
    }

    function spawn_copy(original, copy) {
        // spawns a copy of a node into the direction specificed by the spawn_vector attribute of the original node
        // when the animation gets interrupted by a mouse move, the final copy is teleported to the final destination.
        const originalPos = unapplyView(copy.pos);
        const originalView = { ...view };
        const node = copy;
        const length = 400;
        const rotation = p5.PI / 6 + p5.PI / 10;
        const vec = original.spawn_vector.times(length);
        copy.spawn_vector = original.spawn_vector;
        original.spawn_vector = vec.rotate(rotation).normalized();

        const ani = new Animation(f => { node.pos = applyView(originalPos, originalView).plus(vec.times(f)) }, node, () => {
            let equalNode = graph.findNode(copy);
            if (equalNode !== undefined && !equalNode.mutable) {
                const vec_ = equalNode.pos.minus(node.pos);
                const originalPos_ = unapplyView(node.pos);
                const originalView_ = { ...view };
                const node_ = node;
                const callback_ = () => {
                    const edges = graph.findConnectedEdges(node_);
                    for (let i = 0; i < edges.start.length; i++) {
                        const e = edges.start[i].copy();
                        e.start = equalNode;
                        graph.addEdge(e);
                    }
                    for (let i = 0; i < edges.end.length; i++) {
                        const e = edges.end[i].copy();
                        e.end = equalNode;
                        graph.addEdge(e);
                    }
                    graph.deleteNode(node_);
                }
                const ani_ = new Animation(f => { node_.pos = applyView(originalPos_, originalView_).plus(vec_.times(f)) }, node_, callback_);
                animator.animate.push(ani_);
            }
        });
        animator.animate.push(ani);
    }

    async function complete_node_editing() {
        // Completes the editing of a node, by spawning the node as a copy of the old version of the node
        if (editNode !== undefined && oldEditNode !== undefined) {
            if (!editNode.text.equals(oldEditNode.text)) {
                if (!editNode.mutable) {
                    const editNodeText = editNode.text;
                    editNode.text = oldEditNode.text;
                    editNode = oldEditNode;
                    oldEditNode.text = editNodeText;
                    const mainNode = editNode.main;
                    let mainCopy = undefined;
                    if (editNode.id === mainNode.id) {
                        mainCopy = editNode;
                        mainCopy.main = mainCopy;
                    } else {
                        mainCopy = mainNode.copy();
                        if (level === "3") {
                            mainCopy.text = new Text(UUID());
                        } else if (level === "4") {
                            await hash(editNode.text.getText()).then(hashed => {
                                mainCopy.text = new Text(hashed.substring(0, 8));
                            });
                        }
                    }
                    const subs = mainNode.subs;
                    const subsCopy = [];
                    for (let i = 0; i < subs.length; i++) {
                        if (subs[i].id === editNode.id) {
                            subsCopy.push(editNode);
                        } else {
                            subsCopy.push(subs[i].copy());
                        }
                    }
                    mainCopy.subs = subsCopy;
                    graph.addNode(mainCopy);

                    const predecessor = new Edge(PREDECESSOR, mainCopy, mainNode);
                    graph.addEdge(predecessor);
                    const successor = new Edge(SUCCESSOR, mainNode, mainCopy);
                    graph.addEdge(successor);
                    spawn_copy(mainNode, mainCopy);

                    for (let i = 0; i < subs.length; i++) {
                        graph.addNode(subsCopy[i]);
                        subsCopy[i].main = mainCopy;
                        const subEdge = new Edge(subsCopy[i].edgeText, mainCopy, subsCopy[i]);
                        graph.addEdge(subEdge);
                        spawn_copy(subs[i], subsCopy[i]);
                    }
                }
            }
        }
        if (editNode !== undefined) {
            editNode.text.setEditMode(false);
            editNode = undefined;
        }
        if (oldEditNode !== undefined) {
            oldEditNode.text.setEditMode(false);
            oldEditNode = undefined;
        }
    }

    function abort_node_editing() {
        if (editNode !== undefined) {
            editNode.text.setEditMode(false);
            if (oldEditNode !== undefined) {
                editNode.text = oldEditNode.text;
            }
        }
        editNode = undefined;
        if (oldEditNode !== undefined) {
            oldEditNode.text.setEditMode(false);
        }
        oldEditNode = undefined;
    }

    function abort_dragging() {
        mouseOffset = Vec(0, 0);
        draggedNode = undefined;
        changeViewpoint = false;
    }

    function reset_level() {
        windowWidth = p5.windowWidth;
        windowHeight = p5.windowHeight;
        graph = new Graph();
        animator.clear();
        view.alpha = 255;
        view.viewpoint = Vec(0, 0);
        view.scale = 1;
        helpNodeSettings = { ...oldHelpNodeSettings };
        abort_dragging();
        abort_node_editing();
    }

    function update() {
        if (windowWidth !== p5.windowWidth || windowHeight !== p5.windowHeight) {
            windowWidth = p5.windowWidth;
            windowHeight = p5.windowHeight;
            p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
        }

        const mouse = Vec(p5.mouseX, p5.mouseY);

        for (let i = 0; i < graph.nodes.length; i++) {
            const node = graph.nodes[i];
            node.selected = node.visible && node.touches(mouse);
        }
        animator.update();
    }

    function updateInput() {
        const nextKeyChecks = [];
        keyChecks.forEach(keyCheck => {
            if (keyCheck()) {
                nextKeyChecks.push(keyCheck);
            }
        })
        keyChecks = nextKeyChecks;
    }

    p5.draw = () => {
        p5.background(230, 230, 231);

        update();

        p5.push();
        p5.translate(p5.windowWidth / 2, p5.windowHeight / 2);
        p5.scale(view.scale);
        p5.translate(-p5.windowWidth / 2, -p5.windowHeight / 2);
        p5.translate(view.viewpoint.x, view.viewpoint.y);
        graph.draw();
        if (editNode !== undefined) {
            editNode.draw();
        }
        p5.pop();

        p5.textAlign(p5.RIGHT, p5.TOP);
        p5.fill(COLORS["mediumGrey"])
        p5.textSize(levelTextSize);
        p5.noStroke();
        p5.text(levelText + level, p5.windowWidth - levelTextPadding.x, levelTextPadding.y);

        if (reset_button !== undefined) {
            reset_button.draw(reset_pos());
        }
        if (help_button !== undefined) {
            help_button.draw(help_pos());
        }
        if (right_arrow_button !== undefined) {
            right_arrow_button.draw(right_arrow_pos());
        }
        if (left_arrow_button !== undefined) {
            left_arrow_button.draw(left_arrow_pos());
        }
        if (helpNode !== undefined && help_button !== undefined && helpNodeSettings.visible) {
            let pos = help_pos().minus(Vec(helpNode.width, helpNode.height));
            helpNode.pos = pos.minus(helpNodeSettings.pos);
            const oldAlpha = view.alpha;
            view.alpha = helpNodeSettings.alpha;
            helpNode.draw()
            view.alpha = oldAlpha;
        }

        updateInput();
    }

    function startLevel1() {
        reset_level();
        level = "1";
        const text = "Label: Sensor Driver\nVersion: 1.0.0\nData: 00110011110";
        const node = new Node(
            text,
            applyView(Vec(windowWidth / 4, windowHeight / 4)));
        node.mutable = false;
        node.main = node;
        graph.addNode(node);
    }

    function startLevel2() {
        reset_level();
        level = "2";
        let text = "Sensor-Driver-1.0.0";
        const uuid = new Node(
            text,
            applyView(Vec(p5.windowWidth / 4, p5.windowHeight / 4)));
        uuid.main = uuid;
        graph.addNode(uuid);

        text = "00110011110";
        let distance = Node.minHeight + uuid.height + Text.getWidth(BELONGSTO) * 2;
        const data = new Node(
            text);
        data.pos = Vec(uuid.pos.x + uuid.width / 2 - data.width / 2, uuid.pos.y + distance)
        data.main = uuid;
        data.mutable = false;
        data.edgeText = BELONGSTO;
        graph.addNode(data);
        const belongsto = new Edge(BELONGSTO, uuid, data);
        graph.addEdge(belongsto);

        uuid.subs = [data];
    }

    function startLevel3Or4(lvl) {
        reset_level();
        level = lvl;
        let text = UUID();
        const uuid = new Node(
            text,
            applyView(Vec(windowWidth / 4, windowHeight / 4)));
        uuid.main = uuid;
        if (lvl === "4") {
            uuid.mutable = false;
            uuid.editable = false;
        }
        graph.addNode(uuid);

        text = "00110011110";
        let distance = Node.minHeight + uuid.height + Text.getWidth(BELONGSTO) * 2;
        const data = new Node(
            text,
            applyView(Vec(windowWidth / 4, windowHeight / 4 + distance)));
        data.main = uuid;
        data.mutable = false;
        data.edgeText = BELONGSTO;
        graph.addNode(data);
        const belongsto = new Edge(BELONGSTO, uuid, data);
        graph.addEdge(belongsto);

        if (lvl === "4") {
            hash(text).then(hashed => {
                uuid.text = new Text(hashed.substring(0, 8));
            });
        }

        distance = Node.minHeight + uuid.height + Text.getWidth(LABEL) * 2.5;
        text = "Sensor Driver";
        const driver = new Node(
            text,
            applyView(Vec(windowWidth / 4 - distance, windowHeight / 4 + distance)));
        driver.main = uuid;
        driver.edgeText = LABEL;
        graph.addNode(driver);
        const label = new Edge(LABEL, uuid, driver);
        graph.addEdge(label);

        distance = Node.minHeight + uuid.height + Text.getWidth(VERSION) * 2;
        text = "1.0.0"
        const version = new Node(
            text,
            applyView(Vec(windowWidth / 4 + distance, windowHeight / 4 + distance)));
        version.main = uuid;
        version.edgeText = VERSION;
        graph.addNode(version);
        const versionEdge = new Edge(VERSION, uuid, version);
        graph.addEdge(versionEdge);

        uuid.subs = [data, driver, version];
    }

    function startLevel3() {
        startLevel3Or4("3");
    }

    function startLevel4() {
        startLevel3Or4("4");
    }

    p5.setup = () => {
        canvas.position(0, 0);
        p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
        p5.smooth();
        p5.frameRate(60);
        p5.loadImage('assets/reload.png', img => {
            reset_button = new CircleButton(img, 1 / 2.5, 0, 17);
            reset_pos = () => Vec(10, 10);
        });
        p5.loadImage('assets/arrow.png', img => {
            right_arrow_button = new SquareButton(img, 1 / 3.7, 0);
            right_arrow_pos = () => {
                p5.textSize(levelTextSize);
                p5.noStroke();
                const x = right_arrow_button.size.x + levelTextPadding.x - 3;
                const y = levelTextPadding.y + levelTextSize - 5;
                return Vec(p5.windowWidth - x, y);
            };

            left_arrow_button = new SquareButton(img, 1 / 3.7, p5.PI);
            left_arrow_pos = () => {
                p5.textSize(levelTextSize);
                p5.noStroke();
                const x = right_arrow_pos().x - left_arrow_button.size.x;
                const y = levelTextPadding.y + levelTextSize - 5;
                return Vec(x, y);
            };
        });
        p5.loadImage('assets/question.png', img => {
            help_button = new CircleButton(img, 1 / 2.75, 0, 20);
            help_pos = () => Vec(p5.windowWidth - help_button.size.x - levelTextPadding.x + 10, p5.windowHeight - help_button.size.y - levelTextPadding.y + 10);
        });
    }

    startLevel1();
}