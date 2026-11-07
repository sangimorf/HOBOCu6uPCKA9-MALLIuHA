// Простой стек снапшотов для Undo/Redo
export class History {
    constructor(model, renderer, { limit = 100 } = {}) {
        this.model = model;
        this.renderer = renderer;
        this.limit = limit;
        this.undoStack = [];
        this.redoStack = [];
    }

    snapshot() {
        const json = JSON.stringify(this.model.toJSON());
        this.undoStack.push(json);
        if (this.undoStack.length > this.limit) this.undoStack.shift();
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length < 2) return false;
        const current = this.undoStack.pop();
        this.redoStack.push(current);
        const prev = this.undoStack[this.undoStack.length - 1];
        this._restore(prev);
        return true;
    }

    redo() {
        if (!this.redoStack.length) return false;
        const next = this.redoStack.pop();
        this.undoStack.push(next);
        this._restore(next);
        return true;
    }

    _restore(json) {
        const data = JSON.parse(json);
        const loaded = { nodes: new Map(data.nodes.map(n => [n.id, n])), edges: data.edges, theme: data.theme };
        this.model.nodes = loaded.nodes;
        this.model.edges = loaded.edges;
        this.model.theme = loaded.theme;
        this.renderer.render();
    }
}
