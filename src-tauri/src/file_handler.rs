use crate::{Edge, MindMap, Node};
use std::fs;

pub fn write_map(path: &str, map: &MindMap) -> Result<(), String> {
    let json = serde_json::to_string_pretty(map).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

pub fn read_map(path: &str) -> Result<MindMap, String> {
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

// Заглушки, чтобы модуль не ругался на неиспользуемые импорты при сборке
#[allow(dead_code)]
fn _type_hints(_n: Node, _e: Edge) {}