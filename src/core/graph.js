export class MindMapModel {
    constructor() {
        this.nodes = new Map();
        this.edges = [];
        this._nextId = 1;
    }

    addNode(x, y, title = 'Заголовок', text = '', link = null, color = '#ffffff', shape = 'rect', fontSize = 14, scale = 1) {
        const id = `node_${this._nextId++}`;
        this.nodes.set(id, { 
            id, x, y, title, text, link, color, shape, 
            fontSize, scale, isExpanded: true, baseWidth: 180, // ПО УМОЛЧАНИЮ РАСКРЫТ
            fontColor: '#333333'
        });
        return id;
    }

    addEdge(from, to, color = null, thickness = 2) {
        if (from === to) return null;
        if (this.edges.some(e => e.from === from && e.to === to)) return null;
        
        let edgeColor = color;
        if (!edgeColor) {
            const parent = this.nodes.get(from);
            edgeColor = parent ? parent.color : '#888888';
            if (edgeColor === '#ffffff') edgeColor = '#888888';
        }

        const edge = { from, to, color: edgeColor, thickness };
        this.edges.push(edge);
        return edge;
    }

    removeNode(id) {
        this.nodes.delete(id);
        this.edges = this.edges.filter(e => e.from !== id && e.to !== id);
    }

    toJSON() {
        return { nodes: [...this.nodes.values()], edges: this.edges };
    }

    static fromJSON(data) {
        const m = new MindMapModel();
        for (const n of data.nodes ?? []) {
            // Конвертируем snake_case из Rust обратно в camelCase для JS
            m.nodes.set(n.id, { 
                baseWidth: 180, shape: 'rect', fontSize: 14, scale: 1,
                title: 'Заголовок', text: '', fontColor: '#333333', ...n,
                isExpanded: n.is_expanded !== undefined ? n.is_expanded : (n.isExpanded !== undefined ? n.isExpanded : true),
                fontColor: n.font_color || n.fontColor || '#333333',
                fontSize: n.font_size || n.fontSize || 14
            });
            const num = parseInt(String(n.id).replace('node_', ''), 10);
            if (!isNaN(num) && num >= m._nextId) m._nextId = num + 1;
        }
        m.edges = (data.edges ?? []).map(e => ({
            from: e.from,
            to: e.to,
            color: e.color || '#888888',
            thickness: e.thickness || 2
        }));
        return m;
    }
}