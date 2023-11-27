const VIEWER = (global) => {
    const p5 = global.p5;
    const COLORS = global.COLORS;
    const PREDECESSOR = "core:predecessor";
    const HASSTATE = "lcm:hasState";
    const LABEL = "rdf:label";
    const EDGESTART = "core:start";
    const EDGELABEL = "rdf:label";
    const EDGEEND = "core:end";


    class Text {
        static dotColor = p5.color(COLORS["black"]);
        static annoColor = p5.color(COLORS["black"]);
        static stringColor = p5.color(COLORS["darkGrey"]);
        static enColor = p5.color(COLORS["mediumGrey"]);
        static prefixColor = p5.color(COLORS["mediumGrey"]);
        static subColor = p5.color(COLORS["darkBlue"]);
        static predColor = p5.color(COLORS["darkOrange"]);
        static objColor = p5.color(COLORS["darkBlue"]);

        static isDot(char) {
            if (char === "." || char === ";" || char === "," || char === " ") {
                return true;
            }
            return false;
        }

        static isSeperator(char) {
            return Text.isDot(char) || char === "<" || char === ">";
        }

        static colorText(index, text, depth) {
            if (Text.isDot(text[index])) {
                while (true) {
                    index++;
                    if (index >= text.length || !Text.isDot(text[index])) {
                        return [index, Text.dotColor];
                    }
                }
            }
            if (text[index] === "\"") {
                while (true) {
                    index++;
                    if (index >= text.length) {
                        return [index, Text.dotColor];
                    }
                    if (text[index] === "\"") {
                        return [index + 1, Text.stringColor];
                    }
                }
            }
            if (text.slice(index, index + 3) === "@en") {
                return [index + 3, Text.enColor];
            }
            if (text[index] === "<" || text[index] === ">") {
                return [index + 1, Text.annoColor];
            }
            if (Text.isDot(text[index])) {
                return [index + 1, Text.dotColor];
            }
            index--;
            while (true) {
                index++;
                if (index >= text.length || Text.isSeperator(text[index])) {
                    return [index, [Text.subColor, Text.predColor, Text.objColor][depth]];
                }
                if (text[index] === ":") {
                    return [index + 1, Text.prefixColor];
                }
            }
        }

        static drawText(xPos, yPos, text, depth) {
            let [start, end, color] = [0, 0, undefined];
            while (true) {
                start = end;
                [end, color] = Text.colorText(start, text, depth);
                p5.fill(color);
                p5.text(text.slice(start, end), xPos + p5.textWidth(text.slice(0, start)), yPos);
                if (end >= text.length) {
                    break;
                }
            }
        }

    }

    class Content {
        constructor(value, isEntry) {
            this.value = value;
            this.isEntry = isEntry === undefined ? false : isEntry;
        }

        static parse(value) {
            if (Array.isArray(value)) {
                return new Content(Entry.parse(value), true);
            }
            return new Content(value, false);
        }

        equals(content) {
            if (this.isEntry + content.isEntry === 1) {
                return false;
            }
            if (this.isEntry) {
                return this.value.equals(content.value);
            }
            return this.value === content.value;
        }

        draw(xPos, yPos, termination, depth, hidden = false) {
            if (this.isEntry) {
                const start = "<<";
                const end = ">>" + termination;
                if (!hidden) {
                    Text.drawText(xPos, yPos, start, depth);
                }
                let [x, y] = [xPos + p5.textWidth(start), yPos];
                [x, y] = this.value.draw(x, y, "", depth, hidden);
                if (!hidden) {
                    Text.drawText(x, yPos, end, depth);
                }
                return [x + p5.textWidth(end), y];
            } else {
                let value = undefined;
                if (typeof this.value === 'string' || this.value instanceof String) {
                    value = this.value;
                } else {
                    value = this.value();
                }
                value += termination;
                if (!hidden) {
                    Text.drawText(xPos, yPos, value, depth)
                }
                return [xPos + p5.textWidth(value), yPos + RDF.textSize];
            }
        }
    }
    global.Content = Content;

    class Entry {
        constructor(content, entries) {
            this.content = content;
            this.entries = entries === undefined ? [] : entries;
        }

        static parse(list) {
            let entry = new Entry(Content.parse(list[list.length - 1]));
            for (let i = list.length - 2; i >= 0; i--) {
                entry = new Entry(Content.parse(list[i]), [entry]);
            }
            return entry;
        }

        static contains(entries, entry) {
            for (let i = 0; i < entries.length; i++) {
                if (entries[i].equals(entry)) {
                    return true;
                }
            }
            return false;
        }

        static equalEntries(e1, e2) {
            if (e1.length !== e2.length) {
                return false;
            }
            for (let i = 0; i < e1.length; i++) {
                if (!Entry.contains(e2, e1[i])) {
                    return false;
                }
            }
            return true;
        }

        equals(entry) {
            if (!this.content.equals(entry.content)) {
                return false;
            }
            return Entry.equalEntries(this.entries, entry.entries);
        }

        static group(entries) {
            const newEntries = [];
            for (let i = 0; i < entries.length; i++) {
                let contained = false;
                const entry = entries[i];
                for (let j = 0; j < newEntries.length; j++) {
                    if (entry.content.equals(newEntries[j].content)) {
                        for (let k = 0; k < entry.entries.length; k++) {
                            if (!Entry.contains(newEntries[j].entries, entry.entries[k])) {
                                newEntries[j].entries.push(entry.entries[k]);
                            }
                        }
                        contained = true;
                        break;
                    }
                }
                if (!contained) {
                    newEntries.push(entry);
                }
            }
            for (let i = 0; i < newEntries.length; i++) {
                newEntries[i].entries = Entry.group(newEntries[i].entries);
            }
            return newEntries;
        }

        static get(entries, indices, depth = 0) {
            if (depth + 1 == indices.length) {
                return entries[indices[depth]];
            }
            return Entry.get(entries[indices[depth]].entries, indices, depth + 1);
        }

        static find(content, entries, start = 0) {
            for (let i = start; i < entries.length; i++) {
                if (content.equals(entries[i].content)) {
                    return [i];
                }
                const res = Entry.find(content, entries[i].entries)
                if (res.length > 0) {
                    return [i].concat(res);
                }
            }
            return [];
        }

        static findAllShallow(content, entries) {
            let start = 0;
            const ret = [];
            while (start < entries.length) {
                const res = Entry.find(content, entries, start);
                if (res.length > 0) {
                    ret.push(res[0]);
                    start = res[0] + 1;
                } else {
                    break;
                }
            }
            return ret;
        }

        static sort(entries) {
            // Only works when subjects have at most one predecessor
            const successor = [];
            for (let i = 0; i < entries.length; i++) {
                successor.push([i]);
            }
            for (let i = 0; i < entries.length; i++) {
                const indices = Entry.find(new Content(PREDECESSOR), entries[i].entries);
                if (indices.length > 0) {
                    indices.push([0]);
                    const obj = Entry.get(entries[i].entries, indices).content;
                    let index = -1;
                    for (let j = 0; j < entries.length; j++) {
                        const entry = entries[j];
                        if (entry.content.equals(obj)) {
                            index = j;
                            break;
                        }
                    }
                    if (index >= 0) {
                        successor[index].push(i);
                    }
                }
            }
            for (let i = 0; i < successor.length; i++) {
                let s = successor[i];
                while (s !== undefined && s.length === 2) {
                    const x = s[1];
                    successor[i] = successor[i].concat(successor[x].slice(1));
                    s = successor[x];
                    successor[x] = undefined;
                }
            }
            const newEntries = [];
            for (let i = 0; i < successor.length; i++) {
                const s = successor[i];
                if (s !== undefined) {
                    for (let j = 0; j < s.length; j++) {
                        if (!Entry.contains(newEntries, entries[s[j]])) {
                            newEntries.push(entries[s[j]]);
                        }
                    }
                }
            }
            entries = newEntries;

            const graphIndices = Entry.findAllShallow(new Content(HASSTATE), entries);
            const edgeIndices = Entry.findAllShallow(new Content(EDGESTART), entries);
            const nodeIndices = [];
            for (let i = 0; i < entries.length; i++) {
                nodeIndices.push(true);
            }
            const graphs = [];
            for (let i = 0; i < graphIndices.length; i++) {
                graphs.push(entries[graphIndices[i]]);
                nodeIndices[graphIndices[i]] = false;
            }
            const edges = []
            for (let i = 0; i < edgeIndices.length; i++) {
                edges.push(entries[edgeIndices[i]]);
                nodeIndices[edgeIndices[i]] = false;
            }
            const nodes = [];
            for (let i = 0; i < entries.length; i++) {
                if (nodeIndices[i]) {
                    nodes.push(entries[i]);
                }
            }
            return graphs.concat(nodes).concat(edges);
        }

        draw(xPos, yPos, termination, depth = 0, hidden = false) {
            let [x, y] = this.content.draw(xPos, yPos, this.entries.length === 0 ? termination : "", depth, hidden);
            let [maxX, maxY] = [x, y];
            const offset = x + RDF.xSpacing;
            y = yPos;
            for (let i = 0; i < this.entries.length; i++) {
                [x, y] = this.entries[i].draw(offset, y, i + 1 < this.entries.length && termination !== "" ?
                    RDF.terminations[depth + 1] : termination, depth + 1, hidden);
                if (x > maxX) {
                    maxX = x;
                }
                if (y > maxY) {
                    maxY = y;
                }
                y += RDF.ySpacing;
            }
            return [maxX, maxY];
        }
    }
    global.Entry = Entry;

    class RDF {
        static backgroundColor = COLORS["rdfGrey"];
        static textSize = 15;
        static xSpacing = 5;
        static ySpacing = 5;
        static captionSize = 15;
        static terminations = [".", ";", ",", ""];
        static caption = "Serialized Graph Turtle View";

        constructor(entries) {
            this.entries = Entry.sort(Entry.group(entries));
        }

        add(rdf) {
            return new RDF(this.entries.concat(rdf.entries));
        }

        static parse(graph) {
            const entries = [];

            for (let i = 0; i < graph.nodes.length; i++) {
                const node = graph.nodes[i];
                entries.push([":" + node.id, LABEL, "\"" + node.label + "\"@en"]);
            }
            for (let i = 0; i < graph.edges.length; i++) {
                const edge = graph.edges[i];
                entries.push([":" + edge.id, EDGESTART, ":" + edge.start.id]);
                entries.push([":" + edge.id, EDGELABEL, edge.label]);
                entries.push([":" + edge.id, EDGEEND, ":" + edge.end.id]);
            }
            return new RDF(entries.map(entry => Entry.parse(entry)));
        }

        draw(xPos, yPos, width, height, viewpoint, hidden = false) {
            if (!hidden) {
                // draw background
                p5.noStroke();
                p5.fill(RDF.backgroundColor);
                p5.rect(xPos, yPos, width, height);

                // draw caption
                p5.push();
                p5.translate(viewpoint.x, viewpoint.y);
                p5.fill(COLORS["black"]);
                p5.stroke(COLORS["black"]);
                p5.textSize(RDF.captionSize);
                p5.textAlign(p5.CENTER, p5.CENTER);
                p5.textFont("Open Sans");
                p5.strokeWeight(0.4);
                p5.text(RDF.caption, xPos + width / 2, yPos + RDF.captionSize / 1.5 + 2 * RDF.ySpacing);
            }
            // draw rows
            p5.noStroke();
            p5.textSize(RDF.textSize);
            p5.textAlign(p5.LEFT, p5.TOP);
            let [x, y] = [0, RDF.textSize + 4.5 * RDF.ySpacing];
            let [maxX, maxY] = [x, y];
            for (let i = 0; i < this.entries.length; i++) {
                [x, y] = this.entries[i].draw(xPos + 2 * RDF.xSpacing, y, ".", 0, hidden);
                if (x > maxX) {
                    maxX = x;
                }
                if (y > maxY) {
                    maxY = y;
                }
                y += RDF.ySpacing;
            }

            if (!hidden) {
                p5.pop();
            }
            return [maxX, maxY];
        }

    }
    global.RDF = RDF;
}

export { VIEWER };