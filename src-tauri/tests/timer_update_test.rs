/// Test the format_remaining_time function directly
#[test]
fn test_format_remaining_time() {
    use app_lib::session::format_remaining_time;
    
    // Test various time formats
    assert_eq!(format_remaining_time(0), "00:00");
    assert_eq!(format_remaining_time(1_000), "00:01");
    assert_eq!(format_remaining_time(59_000), "00:59");
    assert_eq!(format_remaining_time(60_000), "01:00");
    assert_eq!(format_remaining_time(3_600_000), "01:00:00");
    assert_eq!(format_remaining_time(3_661_000), "01:01:01");
}

/// Test the timer logic
#[test]
fn test_timer_countdown_logic() {
    use app_lib::session::format_remaining_time;
    
    let total_time_ms = 5_000; // 5 seconds
    let tick_interval = 100; // 100ms
    
    let mut remaining_ms = total_time_ms;
    let mut last_time_str = format_remaining_time(remaining_ms);
    let mut time_values = vec![last_time_str.clone()];
    
    // Simulate timer ticks
    while remaining_ms > 0 {
        remaining_ms = remaining_ms.saturating_sub(tick_interval);
        let current_time_str = format_remaining_time(remaining_ms);
        
        // Only record when the time string changes
        if current_time_str != last_time_str {
            time_values.push(current_time_str.clone());
            last_time_str = current_time_str;
        }
    }
    
    // We should have multiple time updates
    assert!(
        time_values.len() >= 2,
        "Expected at least 2 time updates, got {}",
        time_values.len()
    );
    
    // Verify the time is counting down
    for window in time_values.windows(2) {
        if let [prev, next] = window {
            let prev_secs = time_str_to_seconds(prev);
            let next_secs = time_str_to_seconds(next);
            
            assert!(
                prev_secs > next_secs,
                "Time should be counting down: {} is not greater than {}",
                prev,
                next
            );
        }
    }
}

#[test]
fn test_timer_countdown_with_hours() {
    use app_lib::session::format_remaining_time;
    
    // Probar con un tiempo largo (20 minutos)
    let total_time_ms = 20 * 60 * 1000; // 20:00 en milisegundos
    let tick_interval = 100; // 100ms
    
    let mut remaining_ms = total_time_ms;
    let mut last_time_str = format_remaining_time(remaining_ms);
    let mut time_values = vec![last_time_str.clone()];
    
    // Verificar que el formato inicial sea correcto
    assert_eq!(last_time_str, "20:00", "El formato inicial debería ser 20:00");
    
    // Simular varios minutos de cuenta regresiva
    for _ in 0..5 {  // Probar los primeros 5 segundos
        for _ in 0..10 {  // 10 ticks por segundo (100ms cada uno)
            remaining_ms = remaining_ms.saturating_sub(tick_interval);
            let current_time_str = format_remaining_time(remaining_ms);
            
            // Solo registrar cuando cambia el string de tiempo
            if current_time_str != last_time_str {
                time_values.push(current_time_str.clone());
                last_time_str = current_time_str.clone();
            }
        }
    }
    
    // Deberíamos tener varias actualizaciones
    assert!(
        time_values.len() > 1,
        "Debería haber múltiples actualizaciones, pero solo hay {}",
        time_values.len()
    );
    
    // Verificar que el tiempo vaya disminuyendo correctamente
    for window in time_values.windows(2) {
        if let [prev, next] = window {
            let prev_secs = time_str_to_seconds(prev);
            let next_secs = time_str_to_seconds(next);
            
            assert!(
                prev_secs > next_secs,
                "El tiempo debería ir disminuyendo: {} no es mayor que {}",
                prev,
                next
            );
        }
    }
    
    // Verificar que el formato sigue siendo correcto después de las actualizaciones
    let final_time = format_remaining_time(remaining_ms);
    assert!(
        final_time.starts_with("19:"),
        "Después de varios segundos, el tiempo debería ser aproximadamente 19:xx, pero es {}",
        final_time
    );
}

/// Helper function to convert time string (MM:SS) to total seconds
fn time_str_to_seconds(time_str: &str) -> u64 {
    let parts: Vec<&str> = time_str.split(':').collect();
    
    if parts.len() == 2 {
        // MM:SS format
        let minutes = parts[0].parse::<u64>().unwrap_or(0);
        let seconds = parts[1].parse::<u64>().unwrap_or(0);
        minutes * 60 + seconds
    } else if parts.len() == 3 {
        // HH:MM:SS format
        let hours = parts[0].parse::<u64>().unwrap_or(0);
        let minutes = parts[1].parse::<u64>().unwrap_or(0);
        let seconds = parts[2].parse::<u64>().unwrap_or(0);
        hours * 3600 + minutes * 60 + seconds
    } else {
        0
    }
}
