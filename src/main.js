import './styles.css';
import { invoke } from '@tauri-apps/api/core';
import { save, open } from '@tauri-apps/plugin-dialog';
import { MindMapModel } from './core/graph.js';
import { CanvasRenderer } from './render/canvas.js';
import { applyLanguage, getDict } from './locales.js';

const model = new MindMapModel();
const container = document.getElementById('canvas-container');
let editingNodeId = null;
let currentFilePath = null;

const COLORS = ['#ffffff', '#ffcdd2', '#f8bbd0', '#e1bee7', '#c5cae9', '#bbdefb', '#b3e5fc', '#b2ebf2', '#c8e6c9', '#dcedc8', '#fff9c4', '#ffe0b2', '#ef9a9a', '#f48fb1', '#ce93d8', '#9fa8da', '#90caf9', '#81d4fa', '#80cbc4', '#a5d6a7', '#e6ee9c', '#ffe082', '#ffcc80', '#d7ccc8'];
const BG_COLORS = ['#fafafa', '#ffffff', '#f0f4f8', '#e8f5e9', '#fff3e0', '#fce4ec', '#e0f7fa', '#1e1e1e', '#2d2d2d', '#263238', '#000000'];
const FONT_COLORS = ['#333333', '#ffffff', '#000000', '#d32f2f', '#1976d2', '#388e3c', '#f57c00', '#7b1fa2'];
const EDGE_COLORS = ['#888888', '#333333', '#d32f2f', '#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#e1bee7'];

const renderer = new CanvasRenderer(container, model, {
    onNodeDblClick: (node) => openModal(node),
    onNodeContextMenu: (e, node) => showContextMenu(e, node)
});

const bindEvent = (id, event, handler) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
};

bindEvent('lang-select', 'change', (e) => { applyLanguage(e.target.value); });

// --- МОДАЛКА ЭЛЕМЕНТА ---
function openModal(node) {
    editingNodeId = node.id;
    document.getElementById('modal-title').value = node.title || '';
    document.getElementById('modal-text').value = node.text || '';
    document.getElementById('modal-link').value = node.link || '';
    document.getElementById('modal')?.classList.remove('hidden');
}

bindEvent('modal-cancel', 'click', () => { document.getElementById('modal')?.classList.add('hidden'); editingNodeId = null; });
bindEvent('modal-save', 'click', () => {
    if (editingNodeId) {
        const node = model.nodes.get(editingNodeId);
        if (node) {
            node.title = document.getElementById('modal-title').value;
            node.text = document.getElementById('modal-text').value;
            node.link = document.getElementById('modal-link').value.trim() || null;
            renderer.render();
        }
    }
    document.getElementById('modal')?.classList.add('hidden'); editingNodeId = null;
});

// --- КОНТЕКСТНОЕ МЕНЮ ---
function showContextMenu(event, node) {
    const existing = document.getElementById('context-menu');
    if (existing) existing.remove();
    
    const lang = document.getElementById('lang-select').value;
    const dict = getDict(lang);

    const menu = document.createElement('div');
    menu.id = 'context-menu';
    Object.assign(menu.style, {
        position: 'fixed', left: `${event.clientX}px`, top: `${event.clientY}px`,
        background: '#fff', border: '1px solid #ccc', borderRadius: '6px',
        padding: '8px 0', zIndex: '1000', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        minWidth: '260px', color: '#333', fontSize: '14px', fontFamily: 'sans-serif', maxHeight: '90vh', overflowY: 'auto'
    });

    const actions = [
        { label: dict.menu_create_child, action: () => {
            const childId = model.addNode(node.x + 220, node.y + 100, 'Дочерний', 'Текст...');
            model.addEdge(node.id, childId, node.color === '#ffffff' ? '#888888' : node.color);
            node.isExpanded = true; renderer.render();
        }},
        { label: dict.menu_edit, action: () => openModal(node) },
        { label: dict.menu_shape, action: () => {
            const shapes = ['rect', 'ellipse', 'diamond'];
            node.shape = shapes[(shapes.indexOf(node.shape) + 1) % shapes.length]; renderer.render();
        }},
        { label: dict.menu_delete, action: () => {
            model.removeNode(node.id); renderer.setSelected(null); renderer.render();
        }}
    ];

    actions.forEach(item => {
        const div = document.createElement('div');
        div.textContent = item.label; div.style.padding = '6px 12px'; div.style.cursor = 'pointer';
        div.addEventListener('mouseenter', () => div.style.background = '#f0f0f0');
        div.addEventListener('mouseleave', () => div.style.background = 'transparent');
        div.addEventListener('click', () => { item.action(); });
        menu.appendChild(div);
    });

    const hr = document.createElement('div'); hr.style.cssText = 'height:1px; background:#eee; margin:4px 0;'; menu.appendChild(hr);

    // --- РАЗМЕР, ЦВЕТА, ЛИНИИ ---
    const sizeDiv = document.createElement('div');
    sizeDiv.style.cssText = 'padding:6px 12px; display:flex; align-items:center; gap:8px;';
    sizeDiv.innerHTML = `<span style="flex:1">${dict.menu_size}</span>`;
    const btnMinus = document.createElement('button'); btnMinus.textContent = '-';
    btnMinus.addEventListener('click', (e) => { e.stopPropagation(); node.scale = Math.max(0.5, (node.scale || 1) - 0.1); renderer.render(); });
    const btnPlus = document.createElement('button'); btnPlus.textContent = '+';
    btnPlus.addEventListener('click', (e) => { e.stopPropagation(); node.scale = (node.scale || 1) + 0.1; renderer.render(); });
    sizeDiv.appendChild(btnMinus); sizeDiv.appendChild(btnPlus); menu.appendChild(sizeDiv);

    const colorTitle = document.createElement('div');
    colorTitle.textContent = dict.menu_bg; colorTitle.style.cssText = 'padding:6px 12px 2px; font-size:12px; color:#666;'; menu.appendChild(colorTitle);
    const colorContainer = document.createElement('div');
    colorContainer.style.cssText = 'padding:2px 12px 6px; display:grid; grid-template-columns: repeat(6, 1fr); gap:4px;';
    COLORS.forEach(color => {
        const swatch = document.createElement('div');
        swatch.style.cssText = `width:20px; height:20px; border-radius:50%; background:${color}; border:1px solid #ccc; cursor:pointer;`;
        if (node.color === color) swatch.style.border = '2px solid #333';
        swatch.addEventListener('click', (e) => { e.stopPropagation(); node.color = color; renderer.render(); });
        colorContainer.appendChild(swatch);
    });
    menu.appendChild(colorContainer);

    const fontTitle = document.createElement('div');
    fontTitle.textContent = dict.menu_font; fontTitle.style.cssText = 'padding:6px 12px 2px; font-size:12px; color:#666;'; menu.appendChild(fontTitle);
    const fontColorContainer = document.createElement('div');
    fontColorContainer.style.cssText = 'padding:2px 12px 6px; display:grid; grid-template-columns: repeat(8, 1fr); gap:4px;';
    FONT_COLORS.forEach(color => {
        const swatch = document.createElement('div');
        swatch.style.cssText = `width:20px; height:20px; border-radius:50%; background:${color}; border:1px solid #ccc; cursor:pointer;`;
        if (node.fontColor === color) swatch.style.border = '2px solid #333';
        swatch.addEventListener('click', (e) => { e.stopPropagation(); node.fontColor = color; renderer.render(); });
        fontColorContainer.appendChild(swatch);
    });
    menu.appendChild(fontColorContainer);

    const outEdges = model.edges.filter(e => e.from === node.id);
    if (outEdges.length > 0) {
        const title = document.createElement('div');
        title.textContent = dict.menu_edge_out; title.style.cssText = 'padding:6px 12px 2px; font-size:12px; color:#666;'; menu.appendChild(title);
        const edgeColorCont = document.createElement('div');
        edgeColorCont.style.cssText = 'padding:2px 12px 6px; display:grid; grid-template-columns: repeat(8, 1fr); gap:4px;';
        const currentColor = outEdges[0].color;
        EDGE_COLORS.forEach(color => {
            const swatch = document.createElement('div');
            swatch.style.cssText = `width:20px; height:20px; border-radius:50%; background:${color}; border:1px solid #ccc; cursor:pointer;`;
            if (currentColor === color) swatch.style.border = '2px solid #333';
            swatch.addEventListener('click', (e) => { e.stopPropagation(); outEdges.forEach(edge => edge.color = color); renderer.render(); });
            edgeColorCont.appendChild(swatch);
        });
        menu.appendChild(edgeColorCont);

        const thickDiv = document.createElement('div');
        thickDiv.style.cssText = 'padding:2px 12px 10px; display:flex; gap:6px;';
        const currentThick = outEdges[0].thickness || 2;
        [1, 2, 3, 5].forEach(t => {
            const btn = document.createElement('button');
            btn.textContent = t + 'px';
            btn.style.cssText = `padding:2px 6px; cursor:pointer; border-radius:4px; border: 1px solid #ccc; ${currentThick === t ? 'background:#007bff; color:white; border-color:#007bff;' : 'background:#fff; color:#333;'}`;
            btn.addEventListener('click', (e) => { e.stopPropagation(); outEdges.forEach(edge => edge.thickness = t); renderer.render(); });
            thickDiv.appendChild(btn);
        });
        menu.appendChild(thickDiv);
    }

    document.body.appendChild(menu);

    setTimeout(() => {
        const close = (e) => { 
            if (!menu.contains(e.target)) { 
                menu.remove(); 
                document.removeEventListener('mousedown', close); 
            } 
        };
        document.addEventListener('mousedown', close);
    }, 0);
}

// --- НАСТРОЙКИ ---
bindEvent('btn-settings', 'click', () => {
    const bgColorsDiv = document.getElementById('bg-colors');
    if (bgColorsDiv.innerHTML === '') {
        BG_COLORS.forEach(color => {
            const swatch = document.createElement('div');
            swatch.style.cssText = `width:30px; height:30px; border-radius:4px; background:${color}; border:1px solid #ccc; cursor:pointer;`;
            swatch.addEventListener('click', () => { container.style.backgroundColor = color; container.style.backgroundImage = 'none'; });
            bgColorsDiv.appendChild(swatch);
        });
    }
    document.getElementById('global-modal')?.classList.remove('hidden');
});

bindEvent('global-cancel', 'click', () => document.getElementById('global-modal')?.classList.add('hidden'));

bindEvent('global-save', 'click', () => {
    const url = document.getElementById('bg-image-url').value.trim();
    if (url) container.style.backgroundImage = `url(${url})`;
    document.getElementById('global-modal')?.classList.add('hidden');
});

bindEvent('bg-image-file', 'change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => { container.style.backgroundImage = `url(${event.target.result})`; };
        reader.readAsDataURL(file);
    }
});

// --- СОХРАНЕНИЕ / ЗАГРУЗКА ---
function prepareForRust(modelData) {
    return {
        nodes: modelData.nodes.map(n => ({
            id: n.id, x: n.x, y: n.y, title: n.title, text: n.text, link: n.link,
            color: n.color, font_color: n.fontColor || '#333333', shape: n.shape,
            scale: n.scale || 1, is_expanded: n.isExpanded !== undefined ? n.isExpanded : true,
            font_size: n.fontSize || 14
        })),
        edges: modelData.edges.map(e => ({
            from: e.from, to: e.to, color: e.color || '#888888', thickness: e.thickness || 2
        }))
    };
}

bindEvent('new-map', 'click', () => {
    if(confirm('Создать новую карту?')) {
        model.nodes.clear(); model.edges = []; currentFilePath = null;
        const rootId = model.addNode(window.innerWidth / 2, window.innerHeight / 2, 'Главная', 'Новая карта');
        renderer.render();
    }
});
bindEvent('new-root', 'click', () => {
    const rootId = model.addNode(window.innerWidth / 2 + 200, window.innerHeight / 2 - 100, 'Новая тема', '');
    renderer.render();
});
bindEvent('save', 'click', async () => {
    try {
        if (!currentFilePath) {
            const selected = await save({ title: 'Сохранить', filters: [{ name: 'MindMap', extensions: ['json', 'mindmap'] }], defaultPath: 'МояКарта.mindmap' });
            if (!selected) return;
            currentFilePath = selected;
        }
        await invoke('save_map', { path: currentFilePath, map: prepareForRust(model.toJSON()) });
        alert('Сохранено!');
    } catch (err) { alert('Ошибка: ' + err); }
});
bindEvent('load', 'click', async () => {
    try {
        const selected = await open({ multiple: false, directory: false, title: 'Открыть', filters: [{ name: 'MindMap', extensions: ['json', 'mindmap'] }] });
        if (!selected) return;
        currentFilePath = selected;
        const data = await invoke('load_map', { path: currentFilePath });
        const loaded = MindMapModel.fromJSON(data);
        model.nodes = loaded.nodes; model.edges = loaded.edges;
        renderer.setSelected(null); renderer.render();
    } catch (err) { alert('Ошибка: ' + err); }
});

// --- JSON ОКНО ---
bindEvent('btn-json', 'click', () => document.getElementById('json-modal')?.classList.remove('hidden'));
bindEvent('json-close', 'click', () => document.getElementById('json-modal')?.classList.add('hidden'));

bindEvent('json-export', 'click', () => {
    const ta = document.getElementById('json-template-area');
    if (!ta) return;
    const currentData = model.toJSON();
    const cleanData = {
        nodes: currentData.nodes.map(n => ({
            id: n.id, x: Math.round(n.x), y: Math.round(n.y),
            title: n.title, text: n.text, color: n.color, fontColor: n.fontColor || '#333333',
            shape: n.shape, isExpanded: n.isExpanded
        })),
        edges: currentData.edges.map(e => ({
            from: e.from, to: e.to, color: e.color, thickness: e.thickness
        }))
    };
    ta.value = JSON.stringify(cleanData, null, 2);
});

bindEvent('json-build', 'click', () => {
    try {
        const input = document.getElementById('json-textarea').value.trim();
        if (!input) return alert('Вставьте JSON код!');
        
        const data = JSON.parse(input);
        if (!data.nodes || !data.edges) throw new Error('В JSON должны быть массивы "nodes" и "edges"');

        if (!confirm('Построить новую карту по этому JSON? Текущая карта будет стёрта.')) return;

        model.nodes.clear(); model.edges = []; model._nextId = 1;

        data.nodes.forEach(n => {
            const id = n.id || `node_${model._nextId++}`;
            model.nodes.set(id, {
                id: id, x: n.x || 500, y: n.y || 300,
                title: n.title || 'Без названия', text: n.text || '', link: n.link || null,
                color: n.color || '#ffffff', fontColor: n.fontColor || '#333333',
                shape: n.shape || 'rect', fontSize: n.fontSize || 14, scale: n.scale || 1,
                isExpanded: n.isExpanded !== undefined ? n.isExpanded : (n.is_expanded !== undefined ? n.is_expanded : true), 
                baseWidth: 180
            });
            const num = parseInt(String(id).replace('node_', ''), 10);
            if (!isNaN(num) && num >= model._nextId) model._nextId = num + 1;
        });

        data.edges.forEach(e => {
            if (model.nodes.has(e.from) && model.nodes.has(e.to)) {
                model.addEdge(e.from, e.to, e.color, e.thickness);
            }
        });

        renderer.render();
        document.getElementById('json-modal')?.classList.add('hidden');
        alert('Карта успешно построена!');
    } catch (err) {
        alert('Ошибка в JSON: ' + err.message);
    }
});

applyLanguage('ru');
const rootId = model.addNode(window.innerWidth / 2, window.innerHeight / 2, 'Главная', 'Текст...');
renderer.render();