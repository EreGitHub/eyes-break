use std::io;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum SessionError {
    #[error("Formato de tiempo inválido. Se espera HH:MM:SS")]
    InvalidTimeFormat,
    #[error("El valor del tiempo está fuera de rango")]
    TimeOutOfRange,
    #[error("Error de E/S: {0}")]
    IoError(#[from] io::Error),
}