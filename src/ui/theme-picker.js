const THEMES = {
    light:  { bg: '#fafafa', nodeFill: '#ffffff', text: '#222', edge: '#666666' },
    dark:   { bg: '#1e1e1e', nodeFill: '#2d2d2d', text: '#eeeeee', edge: '#888888' },
    forest: { bg: '#e8f0e0', nodeFill: '#ffffff', text: '#2e4a1f', edge: '#4a7a2a' },
};

export function applyTheme(name, model, renderer) {
    const theme = THEMES[name] ?? THEMES.light;
    model.theme = name;

    document.body.className = `theme-${name}`;
    document.body.style.background = theme.bg;

    for (const node of model.nodes.values()) {
        if (node.color === '#ffffff' || node.color === '#2d2d2d') {
            node.color = theme.nodeFill;
        }
    }
    for (const edge of model.edges) {
        edge.color = theme.edge;
    }
    renderer.render();
}