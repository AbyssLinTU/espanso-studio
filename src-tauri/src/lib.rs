use std::fs;
use std::path::PathBuf;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;

#[tauri::command]
fn get_espanso_path() -> Result<String, String> {
    let appdata = std::env::var("APPDATA").map_err(|e| e.to_string())?;
    let mut path = PathBuf::from(appdata);
    path.push("espanso");
    path.push("match");
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn list_yaml_files() -> Result<Vec<String>, String> {
    let path_str = get_espanso_path()?;
    let path = PathBuf::from(path_str);
    
    let mut files = Vec::new();
    if path.exists() && path.is_dir() {
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.flatten() {
                if let Ok(file_type) = entry.file_type() {
                    if file_type.is_file() {
                        let name = entry.file_name().to_string_lossy().to_string();
                        if name.ends_with(".yml") || name.ends_with(".yaml") {
                            files.push(name);
                        }
                    }
                }
            }
        }
    }
    files.sort();
    Ok(files)
}

#[tauri::command]
fn read_file(filename: String) -> Result<String, String> {
    let mut path = PathBuf::from(get_espanso_path()?);
    path.push(&filename);
    fs::read_to_string(path).map_err(|e| format!("Failed to read {}: {}", filename, e))
}

#[tauri::command]
fn save_file(filename: String, content: String) -> Result<(), String> {
    let mut path = PathBuf::from(get_espanso_path()?);
    path.push(&filename);
    
    // Create backup if file exists (.bak)
    if path.exists() {
        let mut bak_path = path.clone();
        bak_path.set_extension("bak");
        fs::copy(&path, &bak_path).map_err(|e| e.to_string())?;
    }
    
    fs::write(path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn restart_espanso() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    std::process::Command::new("cmd")
        .args(["/C", "espanso restart"])
        .spawn()
        .map_err(|e| e.to_string())?;

    #[cfg(not(target_os = "windows"))]
    std::process::Command::new("sh")
        .args(["-c", "espanso restart"])
        .spawn()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn check_espanso_installed() -> bool {
    // 1. Try running the command via shell
    #[cfg(target_os = "windows")]
    let output = std::process::Command::new("cmd")
        .args(["/C", "espanso --version"])
        .output();

    #[cfg(not(target_os = "windows"))]
    let output = std::process::Command::new("sh")
        .args(["-c", "espanso --version"])
        .output();

    if output.is_ok() && output.unwrap().status.success() {
        return true;
    }

    // 2. On Windows, check common installation path
    #[cfg(target_os = "windows")]
    {
        let common_path = "C:\\Program Files\\espanso\\espanso.exe";
        if std::path::Path::new(common_path).exists() {
            return true;
        }

        let local_appdata = std::env::var("LOCALAPPDATA").unwrap_or_default();
        if !local_appdata.is_empty() {
             let user_path = std::path::Path::new(&local_appdata).join("espanso\\espanso.exe");
             if user_path.exists() {
                 return true;
             }
        }
    }

    // 3. Last fallback: Check if the config folder exists in AppData
    let appdata = std::env::var("APPDATA").unwrap_or_default();
    if !appdata.is_empty() {
        let config_path = std::path::Path::new(&appdata).join("espanso");
        if config_path.exists() {
            return true;
        }
    }
    
    false
}

#[tauri::command]
async fn install_espanso(app: tauri::AppHandle) -> Result<(), String> {
    let resource_path = app.path().resolve("resources/espanso-installer.exe", tauri::path::BaseDirectory::Resource)
        .map_err(|e| format!("Could not find installer: {}", e))?;

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new(resource_path)
            .spawn()
            .map_err(|e| format!("Failed to launch installer: {}", e))?;
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_fs::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
        get_espanso_path,
        list_yaml_files,
        read_file,
        save_file,
        restart_espanso,
        check_espanso_installed,
        install_espanso
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
