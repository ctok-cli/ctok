use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use tauri::Manager;
use walkdir::WalkDir;

// types

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileStat {
    pub path: String,
    pub bytes: u64,
    pub tokens: u64,
    pub ext: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FolderScan {
    pub root: String,
    pub total_files: usize,
    pub total_bytes: u64,
    pub estimated_tokens: u64,
    pub top_heavy_files: Vec<FileStat>,
    pub by_extension: HashMap<String, ExtStat>,
    pub excluded_count: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExtStat {
    pub files: usize,
    pub tokens: u64,
}

// exclusion patterns

const EXCLUDED_DIRS: &[&str] = &[
    "node_modules",
    ".git",
    ".svn",
    ".hg",
    "dist",
    "build",
    "out",
    ".next",
    ".nuxt",
    "target",        // Rust
    ".dart_tool",
    ".pub-cache",
    "build",
    "__pycache__",
    ".venv",
    "venv",
    ".tox",
    "vendor",        // Go / PHP
    ".gradle",
    ".idea",
    ".vscode",
    "coverage",
    ".nyc_output",
    "storybook-static",
    ".cache",
    "tmp",
    ".tmp",
];

const EXCLUDED_EXTENSIONS: &[&str] = &[
    "png", "jpg", "jpeg", "gif", "webp", "svg", "ico", "bmp", "tiff",
    "mp4", "mp3", "wav", "ogg", "flac",
    "woff", "woff2", "ttf", "eot", "otf",
    "zip", "tar", "gz", "bz2", "xz", "7z", "rar",
    "pdf", "doc", "docx", "xls", "xlsx",
    "exe", "dll", "so", "dylib", "a", "lib",
    "lock",          // package-lock, cargo.lock handled by content
    "map",           // source maps
];

const MAX_FILE_BYTES: u64 = 1_000_000; // 1 MB

fn is_excluded(path: &Path) -> bool {
    for component in path.components() {
        let name = component.as_os_str().to_string_lossy();
        if EXCLUDED_DIRS.contains(&name.as_ref()) {
            return true;
        }
        if name.starts_with('.') && name.len() > 1 && name != ".ctokignore" {
            // skip hidden dirs (not files)
            if path.is_dir() {
                return true;
            }
        }
    }
    false
}

fn ext_excluded(ext: &str) -> bool {
    EXCLUDED_EXTENSIONS.contains(&ext.to_lowercase().as_str())
}

/// Rough token estimate: chars / 3.5 for code, chars / 4.5 for prose.
fn estimate_tokens(content_len: u64, ext: &str) -> u64 {
    let code_exts = ["ts", "tsx", "js", "jsx", "rs", "go", "py", "rb", "php",
                     "java", "kt", "swift", "c", "cpp", "h", "cs", "dart",
                     "sh", "bash", "zsh", "ps1", "sql"];
    let divisor = if code_exts.contains(&ext.to_lowercase().as_str()) {
        3.5_f64
    } else {
        4.5_f64
    };
    (content_len as f64 / divisor).ceil() as u64
}

// commands

#[tauri::command]
pub fn scan_folder(path: String) -> Result<FolderScan, String> {
    let root = std::fs::canonicalize(&path)
        .map_err(|e| format!("Cannot resolve path '{}': {}", path, e))?;

    if !root.is_dir() {
        return Err(format!("'{}' is not a directory", path));
    }

    let mut files: Vec<FileStat> = Vec::new();
    let mut excluded_count: usize = 0;
    let mut by_extension: HashMap<String, ExtStat> = HashMap::new();

    for entry in WalkDir::new(&root)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let entry_path = entry.path();

        // Skip the root itself
        if entry_path == root {
            continue;
        }

        // Check if any path component is excluded
        let rel = entry_path
            .strip_prefix(&root)
            .unwrap_or(entry_path);

        if is_excluded(rel) {
            if entry.file_type().is_file() {
                excluded_count += 1;
            }
            continue;
        }

        if !entry.file_type().is_file() {
            continue;
        }

        let ext = entry_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();

        if ext_excluded(&ext) {
            excluded_count += 1;
            continue;
        }

        let bytes = entry.metadata().map(|m| m.len()).unwrap_or(0);
        if bytes > MAX_FILE_BYTES {
            excluded_count += 1;
            continue;
        }

        let tokens = estimate_tokens(bytes, &ext);
        let rel_str = rel.to_string_lossy().replace('\\', "/");

        files.push(FileStat {
            path: rel_str.clone(),
            bytes,
            tokens,
            ext: ext.clone(),
        });

        let stat = by_extension.entry(ext).or_insert(ExtStat { files: 0, tokens: 0 });
        stat.files += 1;
        stat.tokens += tokens;
    }

    let total_bytes: u64 = files.iter().map(|f| f.bytes).sum();
    let estimated_tokens: u64 = files.iter().map(|f| f.tokens).sum();

    // Sort by token count descending, take top 10
    files.sort_by(|a, b| b.tokens.cmp(&a.tokens));
    let top_heavy_files = files.iter().take(10).cloned().collect();

    Ok(FolderScan {
        root: root.to_string_lossy().replace('\\', "/"),
        total_files: files.len(),
        total_bytes,
        estimated_tokens,
        top_heavy_files,
        by_extension,
        excluded_count,
    })
}

#[tauri::command]
pub async fn check_for_updates(app: tauri::AppHandle) -> Result<bool, String> {
    use tauri_plugin_updater::UpdaterExt;
    let update = app
        .updater()
        .map_err(|e| e.to_string())?
        .check()
        .await
        .map_err(|e| e.to_string())?;
    Ok(update.is_some())
}

// app setup

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![scan_folder, check_for_updates])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            // Check for updates silently on launch (non-blocking)
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Ok(true) = check_for_updates(app_handle).await {
                    // Dialog shown automatically by updater plugin when dialog: true
                }
            });

            // Emit drag-drop path to the frontend so it can trigger a scan
            let window_clone = window.clone();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::DragDrop(tauri::DragDropEvent::Dropped {
                    paths,
                    position: _,
                }) = event
                {
                    if let Some(first) = paths.first() {
                        let path_str = first.to_string_lossy().to_string();
                        let _ = window_clone.emit("ctok://drag-drop", path_str);
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running ctok desktop");
}
