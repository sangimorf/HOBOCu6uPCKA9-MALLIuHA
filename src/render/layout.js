// Простое радиальное расположение узлов вокруг центра
export function radialLayout(model, cx = 400, cy = 300, radius = 200) {
    const ids = [...model.nodes.keys()];
    const n = ids.length;
    if (n === 0) return;
    if (n === 1) {
        const node = model.nodes.get(ids[0]);
        node.x = cx;
        node.y = cy;
        return;
    }
    ids.forEach((id, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        const node = model.nodes.get(id);
        node.x = cx + radius * Math.cos(angle);
        node.y = cy + radius * Math.sin(angle);
    });
}