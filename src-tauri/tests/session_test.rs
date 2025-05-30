use app_lib::{
    session::{parse_duration_string, format_remaining_time, CANCEL_FLAG, cancel_session},
    enums::error::SessionError
};
use std::sync::atomic::Ordering;
use std::time::Duration;
use tokio::time as tokio_time;

/// Tests for the parse_duration_string function
#[test]
fn test_parse_duration_string_valid() {    
    assert_eq!(parse_duration_string("00:01:00").unwrap(), 60_000); // 1 min
    assert_eq!(parse_duration_string("01:00:00").unwrap(), 3_600_000); // 1 h
    assert_eq!(parse_duration_string("01:30:45").unwrap(), 5_445_000); // 1h 30m 45s
}

/// Test invalid time formats
#[test]
fn test_parse_duration_string_invalid_format() {    
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
    CANCEL_FLAG.store(false, Ordering::SeqCst);
    
    // Verify it can be set to true
    CANCEL_FLAG.store(true, Ordering::SeqCst);
    assert!(CANCEL_FLAG.load(Ordering::SeqCst));
    
    // Verify it can be set to false
    CANCEL_FLAG.store(false, Ordering::SeqCst);
    assert!(!CANCEL_FLAG.load(Ordering::SeqCst));
}

/// Test session cancellation flag
#[test]
fn test_cancel_session() {    
    CANCEL_FLAG.store(false, Ordering::SeqCst);
        
    assert!(!CANCEL_FLAG.load(Ordering::SeqCst));
        
    cancel_session();
        
    assert!(CANCEL_FLAG.load(Ordering::SeqCst));
    
    CANCEL_FLAG.store(false, Ordering::SeqCst);
}

/// Test that the session respects the cancellation flag
#[tokio::test]
async fn test_session_respects_cancel_flag() {    
    CANCEL_FLAG.store(false, Ordering::SeqCst);
    
    // Simulate a long-running operation that checks the cancel flag
    let handle = tokio::spawn(async move {
        let mut count = 0;

        while !CANCEL_FLAG.load(Ordering::SeqCst) && count < 10 {
            tokio_time::sleep(Duration::from_millis(10)).await;
            count += 1;
        }
        count
    });
    
    // Wait a bit and then cancel
    tokio_time::sleep(Duration::from_millis(30)).await;
    cancel_session();
    
    let count = handle.await.unwrap();
    
    // The loop should have run a few times before being cancelled
    assert!(count < 10);
    assert!(CANCEL_FLAG.load(Ordering::SeqCst));
    
    CANCEL_FLAG.store(false, Ordering::SeqCst);
}