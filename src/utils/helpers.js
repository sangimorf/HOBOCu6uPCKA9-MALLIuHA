// Мелкие утилиты
export function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

export function debounce(fn, ms) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

export function uuid() {
    return 'id_' + Math.random().toString(36).slice(2, 10);
}