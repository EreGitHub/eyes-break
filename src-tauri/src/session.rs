use std::{
    io::{self, Write},
    sync::atomic::{AtomicBool, Ordering},
    time::Duration,
};
use tauri::{Emitter, Window};
use tokio::time;
use crate::enums::error::SessionError;

/// Global flags for session control
/// This flag is used to cancel an ongoing session
pub static CANCEL_FLAG: AtomicBool = AtomicBool::new(false);

/// Update interval in milliseconds
const TICK_INTERVAL_MS: u64 = 100;
/// Milliseconds per second
const MS_PER_SECOND: u64 = 1000;
/// Seconds per minute
const SECONDS_PER_MINUTE: u64 = 60;
/// Minutes per hour
const MINUTES_PER_HOUR: u64 = 60;
/// Seconds per hour
const SECONDS_PER_HOUR: u64 = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;

/// Parses a duration string (HH:MM:SS) into milliseconds
/// # Arguments
/// * `duration` - A string containing the duration in HH:MM:SS format
/// # Returns
/// * `Result<u64, SessionError>` - Total milliseconds or an error
pub fn parse_duration_string(duration: &str) -> Result<u64, SessionError> {
    let parts: Vec<&str> = duration.split(':').collect();

    if parts.len() != 3 {
        return Err(SessionError::InvalidTimeFormat);
    }

    let hours:u64 = parts[0].parse::<u64>().map_err(|_| SessionError::InvalidTimeFormat)?;
    let minutes:u64 = parts[1].parse::<u64>().map_err(|_| SessionError::InvalidTimeFormat)?;
    let seconds:u64 = parts[2].parse::<u64>().map_err(|_| SessionError::InvalidTimeFormat)?;
    
    if minutes >= 60 || seconds >= 60 {
        return Err(SessionError::TimeOutOfRange);
    }

    // Calculate total milliseconds with overflow check
    let total_ms:u64 = hours 
        .checked_mul(SECONDS_PER_HOUR * MS_PER_SECOND)
        .and_then(|h:u64| h.checked_add(minutes * SECONDS_PER_MINUTE * MS_PER_SECOND))
        .and_then(|hm:u64| hm.checked_add(seconds * MS_PER_SECOND))
        .ok_or(SessionError::TimeOutOfRange)?;

    if total_ms == 0 {
        return Err(SessionError::TimeOutOfRange);
    }

    Ok(total_ms)
}

/// Formats remaining time as HH:MM:SS or MM:SS
/// # Arguments
/// * `ms` - Time in milliseconds
/// # Returns
/// * `String` - Formatted time string
pub fn format_remaining_time(ms: u64) -> String {
    let total_seconds:u64 = ms / MS_PER_SECOND;
    let hours:u64 = total_seconds / SECONDS_PER_HOUR;
    let minutes:u64 = (total_seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE;
    let seconds:u64 = total_seconds % SECONDS_PER_MINUTE;

    if hours > 0 {
        format!("{:02}:{:02}:{:02}", hours, minutes, seconds)
    } else {
        format!("{:02}:{:02}", minutes, seconds)
    }
}

/// Starts a new session with the specified duration
/// # Arguments
/// * `window` - Tauri window
/// * `duration_str` - Duration in HH:MM:SS format
/// # Returns
/// * `Result<(), String>` - Operation result
#[tauri::command]
pub async fn start_session(window: Window, duration_str: String) -> Result<(), String> {
    // Reset cancellation flag at the start
    CANCEL_FLAG.store(false, Ordering::SeqCst);
    
    let total_time_ms:u64 = parse_duration_string(&duration_str).map_err(|e| e.to_string())?;
    
    if let Err(e) = window.emit("session-started", true) {
        eprintln!("Failed to emit session-started event: {}", e);
    }

    let mut interval = time::interval(Duration::from_millis(TICK_INTERVAL_MS));
    let start_time = time::Instant::now();
    // Track last emitted percentage to avoid redundant emits
    let mut last_emitted_percentage:f64 = -1.0; 

    loop {
        // Check for cancellation
        if CANCEL_FLAG.load(Ordering::SeqCst) {
            let _ = window.emit("session-cancelled", true);

            println!("\n👀 Session cancelled");

            return Ok(());
        }

        let elapsed = start_time.elapsed();
        let elapsed_ms = elapsed.as_millis() as u64;

        if elapsed_ms >= total_time_ms {
            break;
        }

        let remaining_ms:u64 = total_time_ms - elapsed_ms;
        let percentage:f64 = (elapsed_ms as f64 / total_time_ms as f64) * 100.0;
        let clamped_percentage:f64 = percentage.min(100.0);

        // Only emit progress if percentage changed by at least 1% to reduce overhead
        if (clamped_percentage - last_emitted_percentage).abs() >= 1.0 {
            let time_left_str = format_remaining_time(remaining_ms);
            
            // Emit progress updates
            let _ = window.emit("session-progress", clamped_percentage);
            let _ = window.emit("session-time-progress", time_left_str.clone());

            print!(
                "\r🟢 Running... {:.0}% - ⏳ Time remaining: {}",
                clamped_percentage, time_left_str
            );            

            let _ = io::stdout().flush();

            last_emitted_percentage = clamped_percentage;
        }

        interval.tick().await;
    }
    
    let _ = window.emit("session-completed", true);

    println!("\n✅ Session completed successfully!");

    Ok(())
}

/// Cancels the current session
#[tauri::command]
pub fn cancel_session() {
    CANCEL_FLAG.store(true, Ordering::SeqCst);
}