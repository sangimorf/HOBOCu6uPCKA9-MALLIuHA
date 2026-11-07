export function showNodeMenu(event, node, actions) {
    const existing = document.getElementById('node-menu');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.id = 'node-menu';
    menu.style.position = 'fixed';
    menu.style.left = `${event.clientX}px`;
    menu.style.top = `${event.clientY}px`;
    menu.style.background = '#fff';
    menu.style.border = '1px solid #ccc';
    menu.style.padding = '4px';
    menu.style.zIndex = '1000';
    menu.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
    menu.style.color = '#000';
    menu.style.borderRadius = '4px';
    menu.style.fontSize = '14px';

    const items = [
        { label: 'Изменить текст', onClick: () => actions.editText?.(node) },
        { label: 'Сменить цвет', onClick: () => actions.changeColor?.(node) },
        { label: 'Сменить форму', onClick: () => actions.changeShape?.(node) },
        { label: 'Удалить узел', onClick: () => actions.remove?.(node) },
    ];

    for (const item of items) {
        const btn = document.createElement('div');
        btn.textContent = item.label;
        btn.style.padding = '6px 12px';
        btn.style.cursor = 'pointer';
        btn.addEventListener('mouseenter', () => { btn.style.background = '#eee'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; });
        btn.addEventListener('click', () => { menu.remove(); item.onClick(); });
        menu.appendChild(btn);
    }

    document.body.appendChild(menu);
    
    // Закрытие меню по клику вне его
    setTimeout(() => {
        const close = (e) => {
            if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('click', close); }
        };
        document.addEventListener('click', close);
    }, 0);
}