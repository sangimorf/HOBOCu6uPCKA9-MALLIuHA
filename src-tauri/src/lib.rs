mod file_handler;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct MindMap {
    pub nodes: Vec<Node>,
    pub edges: Vec<Edge>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Node {
    pub id: String,
    pub x: f64,
    pub y: f64,
    pub title: String,
    pub text: String,
    pub link: Option<String>,
    pub color: String,
    pub font_color: String,
    pub shape: String,
    pub scale: f64,
    #[serde(default = "default_true")]
    pub is_expanded: bool,
    pub font_size: f64,
    #[serde(default = "default_one")]
    pub stretch_x: f64,
    #[serde(default = "default_one")]
    pub stretch_y: f64,
}

fn default_true() -> bool { true }
fn default_one() -> f64 { 1.0 }

#[derive(Serialize, Deserialize, Clone)]
pub struct Edge {
    pub from: String,
    pub to: String,
    #[serde(default)]
    pub color: String,
    #[serde(default)]
    pub thickness: f64,
}

#[tauri::command]
fn save_map(path: String, map: MindMap) -> Result<(), String> {
    file_handler::write_map(&path, &map)
}

#[tauri::command]
fn load_map(path: String) -> Result<MindMap, String> {
    file_handler::read_map(&path)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![save_map, load_map])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}