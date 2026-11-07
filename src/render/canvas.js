export class CanvasRenderer {
    constructor(container, model, callbacks = {}) {
        this.model = model;
        this.callbacks = callbacks;
        this.selectedNodeId = null;
        
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        container.appendChild(this.svg);

        this.viewport = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.viewport.id = 'viewport';
        this.svg.appendChild(this.viewport);

        this.viewTransform = { x: 0, y: 0, scale: 1 };
        this._isPanning = false;
        this._panStart = { x: 0, y: 0 };
        this._dragData = null;
        
        this._initEvents();
    }

    _initEvents() {
        this.svg.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const zoomFactor = 1.1;
                const direction = e.deltaY > 0 ? -1 : 1;
                const newScale = direction > 0 ? this.viewTransform.scale * zoomFactor : this.viewTransform.scale / zoomFactor;
                const clampedScale = Math.max(0.2, Math.min(newScale, 5));
                
                const mouseX = e.clientX;
                const mouseY = e.clientY - 44;
                const xs = (mouseX - this.viewTransform.x) / this.viewTransform.scale;
                const ys = (mouseY - this.viewTransform.y) / this.viewTransform.scale;

                this.viewTransform.x = mouseX - xs * clampedScale;
                this.viewTransform.y = mouseY - ys * clampedScale;
                this.viewTransform.scale = clampedScale;

                this._updateViewport();
            }
        }, { passive: false });

        this.svg.addEventListener('mousedown', (e) => {
            if (e.button === 1) {
                e.preventDefault();
                this._isPanning = true;
                this._panStart = { x: e.clientX - this.viewTransform.x, y: e.clientY - this.viewTransform.y };
            }
            if (e.button === 0 && (e.target.tagName === 'svg' || e.target.id === 'viewport')) {
                this.setSelected(null);
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (this._isPanning) {
                this.viewTransform.x = e.clientX - this._panStart.x;
                this.viewTransform.y = e.clientY - this._panStart.y;
                this._updateViewport();
            }
            if (this._dragData) this._onMouseMoveNode(e);
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 1) this._isPanning = false;
            if (e.button === 0) this._dragData = null;
        });
    }

    setSelected(node) {
        if (this.selectedNodeId === (node ? node.id : null)) return;
        this.selectedNodeId = node ? node.id : null;
        this.callbacks.onNodeSelect?.(node);
        this.render();
    }

    _updateViewport() {
        this.viewport.setAttribute('transform', `translate(${this.viewTransform.x}, ${this.viewTransform.y}) scale(${this.viewTransform.scale})`);
    }

    render() {
        this.viewport.innerHTML = '';
        const { model } = this;

        // ОТРИСОВКА ЛИНИЙ С УЧЕТОМ ЦВЕТА И ТОЛЩИНЫ
        for (const edge of model.edges) {
            const a = model.nodes.get(edge.from);
            const b = model.nodes.get(edge.to);
            if (!a || !b) continue;
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', a.x);
            line.setAttribute('y1', a.y);
            line.setAttribute('x2', b.x);
            line.setAttribute('y2', b.y);
            
            // Берем цвет и толщину из модели связи, если нет — ставим дефолт
            line.setAttribute('stroke', edge.color || '#888888');
            line.setAttribute('stroke-width', edge.thickness || 2);
            
            this.viewport.appendChild(line);
        }

        for (const node of model.nodes.values()) {
            this._drawNode(node);
        }
    }

    _drawNode(node) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'node-group');
        g.dataset.id = node.id;
        
        const fs = node.fontSize || 14;
        const scale = node.scale || 1;
        const charWidth = fs * 0.55;
        
        let displayTitle = node.title || '';
        let displayText = node.text || '';
        const textColor = node.fontColor || '#333333';

        if (!node.isExpanded) {
            if (displayText.length > 20) {
                displayText = displayText.substring(0, 20) + '...';
            }
        }

        let lines = [];
        if (displayText) {
            const words = displayText.split(' ');
            let curr = '';
            for (const w of words) {
                if ((curr + w).length > 25) {
                    if (curr) lines.push(curr.trim());
                    curr = w + ' ';
                } else {
                    curr += w + ' ';
                }
            }
            if (curr) lines.push(curr.trim());
        }

        const lineHeight = fs * 1.4;
        const titleH = displayTitle ? lineHeight : 0;
        const textH = lines.length * lineHeight;
        const padding = 24;
        
        const contentWidth = Math.max(displayTitle.length, ...lines.map(l => l.length)) * charWidth;
        const w = Math.max(160 * scale, contentWidth + padding);
        const h = Math.max(60 * scale, (titleH + textH + padding) * scale);

        let shape;
        if (node.shape === 'ellipse') {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            shape.setAttribute('rx', w / 2);
            shape.setAttribute('ry', h / 2);
        } else if (node.shape === 'diamond') {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            shape.setAttribute('points', `0,-${h/2} ${w/2},0 0,${h/2} -${w/2},0`);
        } else {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shape.setAttribute('width', w);
            shape.setAttribute('height', h);
            shape.setAttribute('x', -w / 2);
            shape.setAttribute('y', -h / 2);
            shape.setAttribute('rx', 6);
        }
        
        shape.setAttribute('class', `node-rect ${this.selectedNodeId === node.id ? 'node-selected' : ''}`);
        shape.setAttribute('fill', node.color);
        g.appendChild(shape);

        let currentY = -h / 2 + padding / 2;

        if (displayTitle) {
            const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            titleEl.setAttribute('class', 'node-title');
            titleEl.setAttribute('x', 0);
            titleEl.setAttribute('y', currentY + (lineHeight * scale) / 2);
            titleEl.setAttribute('font-size', (fs + 2) * scale);
            titleEl.setAttribute('fill', textColor);
            titleEl.textContent = displayTitle;
            g.appendChild(titleEl);
            currentY += lineHeight * scale;
        }

        if (lines.length > 0) {
            lines.forEach((line) => {
                const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                textEl.setAttribute('class', 'node-text');
                textEl.setAttribute('x', 0);
                textEl.setAttribute('y', currentY + (lineHeight * scale) / 2);
                textEl.setAttribute('font-size', fs * scale);
                textEl.setAttribute('fill', textColor);
                textEl.textContent = line;
                g.appendChild(textEl);
                currentY += lineHeight * scale;
            });
        }

        const btnGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        btnGroup.style.cursor = 'pointer';
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', w / 2 - 10);
        circle.setAttribute('cy', -h / 2 - 10);
        circle.setAttribute('r', '10');
        circle.setAttribute('fill', '#fff');
        circle.setAttribute('stroke', '#007bff');
        circle.setAttribute('stroke-width', '2');
        
        const btn = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        btn.setAttribute('class', 'toggle-btn');
        btn.setAttribute('x', w / 2 - 10);
        btn.setAttribute('y', -h / 2 - 10);
        btn.setAttribute('text-anchor', 'middle');
        btn.setAttribute('dominant-baseline', 'central');
        btn.setAttribute('font-size', '16');
        btn.textContent = node.isExpanded ? '−' : '+';
        
        btnGroup.appendChild(circle);
        btnGroup.appendChild(btn);
        
        btnGroup.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            node.isExpanded = !node.isExpanded;
            this.render();
        });
        g.appendChild(btnGroup);
        
        g.setAttribute('transform', `translate(${node.x}, ${node.y})`);
        this.viewport.appendChild(g);

        g.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            e.stopPropagation();
            this.setSelected(node);
            
            const pt = this.svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const svgP = pt.matrixTransform(this.viewport.getScreenCTM().inverse());

            this._dragData = { node, offsetX: node.x - svgP.x, offsetY: node.y - svgP.y, g };
        });

        g.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.callbacks.onNodeDblClick?.(node);
        });

        g.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.setSelected(node);
            this.callbacks.onNodeContextMenu?.(e, node);
        });
    }

    _onMouseMoveNode(e) {
        if (!this._dragData) return;
        const { node, offsetX, offsetY, g } = this._dragData;
        
        const pt = this.svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(this.viewport.getScreenCTM().inverse());

        node.x = svgP.x + offsetX;
        node.y = svgP.y + offsetY;
        
        g.setAttribute('transform', `translate(${node.x}, ${node.y})`);
        this.render();
        
        const el = Array.from(this.viewport.querySelectorAll('.node-group')).find(n => n.dataset.id === node.id);
        if (el) this.viewport.appendChild(el);
    }
}