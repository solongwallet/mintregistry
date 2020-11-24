#![deny(missing_docs)]
#![forbid(unsafe_code)]

//! a extension for mint symbol, support symbol/name etc for mint with a list file

pub mod error;
pub mod instruction;
pub mod processor;
pub mod state;

#[cfg(not(feature = "no-entrypoint"))]
pub mod entrypoint;

// Export current sdk types for downstream users building with a different sdk version
pub use solana_program;


