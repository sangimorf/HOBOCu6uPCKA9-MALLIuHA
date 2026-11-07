export function bindToolbar({ onAddNode, onSave, onLoad, onThemeChange }) {
    const map = {
        'add-root': onAddNode,
        'save': onSave,
        'load': onLoad,
    };

    for (const [id, handler] of Object.entries(map)) {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                handler();
            });
        }
    }

    const themeSel = document.getElementById('theme');
    if (themeSel) {
        themeSel.addEventListener('change', (e) => onThemeChange(e.target.value));
    }
}