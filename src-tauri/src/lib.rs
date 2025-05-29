use lazy_static::lazy_static;
use std::io::{self, Write};
use std::path::Path;
use std::sync::{Arc, Mutex};
use tauri::Manager;
use tauri::{Emitter, Window};
use tokio::time::{sleep, Duration};
// use tauri::menu::{MenuBuilder, MenuItemBuilder};
// use tauri::tray::{TrayIconBuilder};

lazy_static! {
    static ref CANCEL_FLAG: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
}

#[tauri::command]
fn greet(name: String) -> String {
    dbg!(&name); // This will print the value of name and return it
    println!("Hello, {}!", name);
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn exit_app(app: tauri::AppHandle) {
    app.exit(0);
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
        // let _ = window.emit("session-error", "Formato de tiempo inválido");
        println!("Formato de tiempo inválido");
        let _ = window.emit("session-started", false);

        return;
    };

    let _ = window.emit("session-started", true);

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
                println!();
                println!("👀 Sesión cancelada..");
                return;
            }
        }

        let remaining_ms = total_time_ms - elapsed;
        let percentage = (elapsed as f64 / total_time_ms as f64) * 100.0;
        let clamped_percentage = percentage.min(100.0);
        let time_left_str = format_remaining_time(remaining_ms);

        let _ = window.emit("session-progress", clamped_percentage);
        let _ = window.emit("session-time-progress", time_left_str.clone());

        print!(
            "\r{:.0}% - ⏳ Tiempo restante: {}",
            clamped_percentage, time_left_str
        );
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
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            #[cfg(debug_assertions)] // Solo en modo desarrollo
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }

            // let quit = MenuItemBuilder::new("Quit").id("quit").build(app).unwrap();
            // let hide = MenuItemBuilder::new("Hide").id("hide").build(app).unwrap();
            // let show = MenuItemBuilder::new("Show").id("show").build(app).unwrap();
            // let test = MenuItemBuilder::new("Test").id("test").build(app).unwrap();
            // // we could opt handle an error case better than calling unwrap
            // let menu = MenuBuilder::new(app)
            // .items(&[&quit, &hide, &show, &test])
            // .build()
            // .unwrap();

            // let _ = TrayIconBuilder::new()
            // .icon(app.default_window_icon().unwrap().clone())
            // .menu(&menu)
            // .on_menu_event(|app, event| match event.id().as_ref() {
            //   "quit" => app.exit(0),
            //   "hide" => {
            //     dbg!("menu item hide clicked");
            //     let window = app.get_webview_window("main").unwrap();
            //     window.hide().unwrap();
            //   }
            //   "show" => {
            //     dbg!("menu item show clicked");
            //     let window = app.get_webview_window("main").unwrap();
            //     window.show().unwrap();
            //   }
            //   "test" => {
            //     dbg!("menu item test clicked");
            //   }
            //   _ => {}
            // })
            // // .on_tray_icon_event(|tray_icon, event| match event.click_type {
            // //   ClickType::Left => {
            // //     dbg!("system tray received a left click");

            // //     // let window = tray_icon.app_handle().get_webview_window("main").unwrap();
            // //     // let _ = window.show().unwrap();
            // //     // let logical_size = tauri::LogicalSize::<f64> {
            // //     //   width: 300.00,
            // //     //   height: 400.00,
            // //     // };
            // //     // let logical_s = tauri::Size::Logical(logical_size);
            // //     // let _ = window.set_size(logical_s);
            // //     // let logical_position = tauri::LogicalPosition::<f64> {
            // //     //   x: event.x - logical_size.width,
            // //     //   y: event.y - logical_size.height - 70.,
            // //     // };
            // //     // let logical_pos: tauri::Position = tauri::Position::Logical(logical_position);
            // //     // let _ = window.set_position(logical_pos);
            // //     // let _ = window.set_focus();
            // //   }
            // //   ClickType::Right => {
            // //     dbg!("system tray received a right click");
            // //     // let window = tray_icon.app_handle().get_webview_window("main").unwrap();
            // //     // window.hide().unwrap();
            // //   }
            // //   ClickType::Double => {
            // //     dbg!("system tray received a double click");
            // //   }
            // // })
            // .build(app);

            // let window = app.get_webview_window("main").unwrap();
            // let is_dev: bool = tauri::is_dev();
            // if is_dev {
            //     window.open_devtools();
            // } else {
            //     window.close_devtools();
            // }

            //hide app in dock macos
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

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
            greet,
            start_session,
            list_files,
            cancel_session,
            exit_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
