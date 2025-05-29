use app_lib::{
    session::{parse_duration_string, format_remaining_time, CANCEL_FLAG},
    enums::error::SessionError
};
use std::sync::atomic::Ordering;

/// Tests for the parse_duration_string function
#[test]
fn test_parse_duration_string_valid() {
    // Test valid time formats
    assert_eq!(parse_duration_string("00:01:00").unwrap(), 60_000); // 1 minuto
    assert_eq!(parse_duration_string("01:00:00").unwrap(), 3_600_000); // 1 hora
    assert_eq!(parse_duration_string("01:30:45").unwrap(), 5_445_000); // 1h 30m 45s
}

/// Test invalid time formats
#[test]
fn test_parse_duration_string_invalid_format() {
    // Test invalid formats
    assert!(matches!(
        parse_duration_string("invalid"),
        Err(SessionError::InvalidTimeFormat)
    ));
    assert!(matches!(
        parse_duration_string("1:2:3:4"),
        Err(SessionError::InvalidTimeFormat)
    ));
    assert!(matches!(
        parse_duration_string("01-02-03"),
        Err(SessionError::InvalidTimeFormat)
    ));
}

/// Test invalid time values
#[test]
fn test_parse_duration_string_invalid_time() {
    // Test invalid time values
    assert!(matches!(
        parse_duration_string("00:60:00"),
        Err(SessionError::TimeOutOfRange)
    ));
    assert!(matches!(
        parse_duration_string("00:00:60"),
        Err(SessionError::TimeOutOfRange)
    ));
    // Test zero time
    assert!(matches!(
        parse_duration_string("00:00:00"),
        Err(SessionError::TimeOutOfRange)
    ));
    // Test overflow (this doesn't actually fail because u64 can handle large values)
    // The function handles overflow correctly with checked_mul and checked_add
    let result = parse_duration_string("1000000:00:00");
    assert!(result.is_ok(), "Overflow should be handled without errors");
}

/// Tests for the format_remaining_time function
#[test]
fn test_format_remaining_time() {
    assert_eq!(format_remaining_time(0), "00:00");
    assert_eq!(format_remaining_time(1_000), "00:01");
    assert_eq!(format_remaining_time(60_000), "01:00");
    assert_eq!(format_remaining_time(3_600_000), "01:00:00");
    assert_eq!(format_remaining_time(3_661_000), "01:01:01");
}

/// Test the cancellation flag
#[test]
fn test_cancel_flag() {
    // Set up the flag
    CANCEL_FLAG.store(false, Ordering::SeqCst);
    
    // Verify it can be set to true
    CANCEL_FLAG.store(true, Ordering::SeqCst);
    assert!(CANCEL_FLAG.load(Ordering::SeqCst));
    
    // Verify it can be set to false
    CANCEL_FLAG.store(false, Ordering::SeqCst);
    assert!(!CANCEL_FLAG.load(Ordering::SeqCst));
}