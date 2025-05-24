use std::path::Path;
use tauri::Emitter;
use tauri::Window;
use tokio::time::{sleep, Duration};

#[tauri::command]
fn greet(name: String) -> String {
    dbg!(&name); // This will print the value of name and return it
    println!("Hello, {}!", name);
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn start_session(window: Window, total_time_ms: u64) {
    let step_ms = 100;
    let mut elapsed = 0;

    while elapsed <= total_time_ms {
        let percentage = (elapsed as f64 / total_time_ms as f64) * 100.0;
        let clamped_percentage = percentage.min(100.0);
        let _ = window.emit("session-progress", clamped_percentage);
        println!("{} %", clamped_percentage);
        sleep(Duration::from_millis(step_ms)).await;
        elapsed += step_ms;
    }

    let _ = window.emit("session-completed", true);
    println!("Session completed");
}

#[tauri::command(async)]
fn list_files(path: &str) -> Vec<String> {
    let path = Path::new(&path);

    let files = path
        .read_dir()
        .unwrap()
        .map(|entry| entry.unwrap().file_name().to_str().unwrap().to_owned())
        .collect::<Vec<String>>();

    dbg!(&files);

    files
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
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
        .invoke_handler(tauri::generate_handler![greet, start_session, list_files])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
