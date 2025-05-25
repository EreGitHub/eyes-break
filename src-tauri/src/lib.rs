use std::path::Path;
use tauri::Emitter;
use tauri::Window;
use tokio::time::{sleep, Duration};
use std::io::{self, Write};
use std::sync::{Arc, Mutex};
use lazy_static::lazy_static;

lazy_static! {
    static ref CANCEL_FLAG: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
}

#[tauri::command]
fn greet(name: String) -> String {
    dbg!(&name); // This will print the value of name and return it
    println!("Hello, {}!", name);
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn parse_duration_string(duration: &str) -> Option<u64> {
    let parts: Vec<u64> = duration
        .split(':')
        .filter_map(|p| p.parse().ok())
        .collect();

    if parts.len() == 3 {
        let hours = parts[0];
        let minutes = parts[1];
        let seconds = parts[2];
        Some((hours * 3600 + minutes * 60 + seconds) * 1000)
    } else {
        None
    }
}

fn format_remaining_time(ms: u64) -> String {
    let total_seconds = ms / 1000;
    let hours = total_seconds / 3600;
    let minutes = (total_seconds % 3600) / 60;
    let seconds = total_seconds % 60;

    if hours > 0 {
        format!("{:02}:{:02}:{:02}", hours, minutes, seconds)
    } else {
        format!("{:02}:{:02}", minutes, seconds)
    }
}

// #[tauri::command]
// async fn start_sessions_test(window: Window, total_time_ms: u64) {
//     let step_ms = 100;
//     let mut elapsed = 0;

//     while elapsed <= total_time_ms {
//         let percentage = (elapsed as f64 / total_time_ms as f64) * 100.0;
//         let clamped_percentage = percentage.min(100.0);
//         let _ = window.emit("session-progress", clamped_percentage);
//         println!("{} %", clamped_percentage);
//         sleep(Duration::from_millis(step_ms)).await;
//         elapsed += step_ms;
//     }

//     let _ = window.emit("session-completed", true);
//     println!("Session completed");
// }


#[tauri::command]
async fn start_session(window: Window, duration_str: String) {
    println!("Duration string: {}", duration_str);
    let Some(total_time_ms) = parse_duration_string(&duration_str) else {
        let _ = window.emit("session-error", "Formato de tiempo inválido");
        return;
    };

      // Reset cancel flag
    {
        let mut cancel = CANCEL_FLAG.lock().unwrap();
        *cancel = false;
    }


    // let step_ms: u64 = 1000;
    let step_ms: u64 = 100;
    let mut elapsed = 0;

    while elapsed <= total_time_ms {
        // Verificar cancelación
        {
            let cancel = CANCEL_FLAG.lock().unwrap();
            if *cancel {
                let _ = window.emit("session-cancelled", true);
                println!("Sesión cancelada");
                return;
            }
        }

        let remaining_ms = total_time_ms - elapsed;
        let percentage = (elapsed as f64 / total_time_ms as f64) * 100.0;
        let clamped_percentage = percentage.min(100.0);
        let time_left_str = format_remaining_time(remaining_ms);

        let _ = window.emit("session-progress", clamped_percentage);
        let _ = window.emit("session-time-left", time_left_str.clone());        
        
        print!("\r{:.0}% - ⏳ Tiempo restante: {}", clamped_percentage, time_left_str);
        io::stdout().flush().unwrap();

        sleep(Duration::from_millis(step_ms)).await;
        elapsed += step_ms;
    }

    let _ = window.emit("session-completed", true);
    println!();
    println!("Session completed");
}



#[tauri::command]
fn cancel_session() {
    let mut cancel = CANCEL_FLAG.lock().unwrap();
    *cancel = true;
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
        .invoke_handler(tauri::generate_handler![greet, start_session, list_files, cancel_session])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
