//! Error type


use num_derive::FromPrimitive;
use solana_program::{decode_error::DecodeError, 
    program_error::ProgramError,
    info,
    program_error::PrintProgramError};
use thiserror::Error;
use num_traits::FromPrimitive;

/// Errors that may be returned by the mint-registry program.
#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum RegistryError {
    /// Invalid instruction
    #[error("Invalid instruction")]
    InvalidInstruction,

    ///  SymbolToLong
    #[error("Symbol or Name is to long (<16)")]
    SymbolToLong,

    /// NoAuthority
    #[error("Must have authority to create mint")]
    NoAuthority,

    /// NoMintAuthority
    #[error("No mint_authority for mint")]
    NoMintAuthority, 

    /// Operation overflowed
    #[error("Operation overflowed")]
    Overflow,

    /// TestError 
    #[error("TestError")]
    TestError,
}
impl From<RegistryError> for ProgramError {
    fn from(e: RegistryError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
impl<T> DecodeError<T> for RegistryError {
    fn type_of() -> &'static str {
        "RegistryError"
    }
}


impl PrintProgramError for RegistryError {
    fn print<E>(&self)
    where
        E: 'static + std::error::Error + DecodeError<E> + PrintProgramError + FromPrimitive,
    {
        match self {
            RegistryError::InvalidInstruction => info!("Invalid instruction"),
            RegistryError::SymbolToLong => info!("Symbol or Name is to long (<16)"),
            RegistryError::NoAuthority => info!("Must have authority to create mint"),
            RegistryError::NoMintAuthority => info!("No mint_authority for mint"),
            RegistryError::Overflow => info!("Operation overflowed"),
            RegistryError::TestError => info!("TestError"),
        }
    }
}