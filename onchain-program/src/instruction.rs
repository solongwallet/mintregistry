//! Instruction types

use crate::error::RegistryError;
use solana_program::{
    //instruction::{AccountMeta, Instruction},
    program_error::ProgramError,
    //program_option::COption,
    pubkey::Pubkey,
    info,
    //sysvar,
};
//use std::convert::TryInto;
//use std::mem::size_of;
use std::str::from_utf8;

/// Instructions supported by the mint-registry program.
#[repr(C)]
#[derive(Clone, Debug, PartialEq)]
pub enum RegistryInstruction {
    /// Initializes a new mint and optionally deposits all the newly minted
    RegisterMint {
        /// mint 
        mint: Pubkey,
        /// symbol
        symbol: String,
        /// name
        name: String,
    },
}


impl RegistryInstruction {
    /// Unpacks a byte buffer into a [RegistryInstruction](enum.RegistryInstruction.html).
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        use RegistryError::InvalidInstruction;

        let (&tag, rest) = input.split_first().ok_or(InvalidInstruction)?;
        Ok(match tag { //RegisterMint
            1 => {
                let (mint, rest) = Self::unpack_pubkey(rest)?;
                let (&len, rest) = rest.split_first().ok_or(InvalidInstruction)?;
                let (symbol_buf, rest) = rest.split_at(len.into());
                let symbol = String::from(from_utf8(symbol_buf).unwrap());
                let (&len, rest) = rest.split_first().ok_or(InvalidInstruction)?;
                let (name_buf, _rest) = rest.split_at(len.into());
                let name = String::from(from_utf8(name_buf).unwrap());
                info!("mint_registry:mint: ");
                info!("mint_registry:symbol:");
                info!(symbol.as_str());
                info!("mint_registry:name: ");
                info!(name.as_str());
                Self::RegisterMint{
                    mint,
                    symbol,
                    name,
                }
            },
            _ => return Err(RegistryError::InvalidInstruction.into()),
        })
    }

    fn unpack_pubkey(input: &[u8]) -> Result<(Pubkey, &[u8]), ProgramError> {
        if input.len() >= 32 {
            let (key, rest) = input.split_at(32);
            let pk = Pubkey::new(key);
            Ok((pk, rest))
        } else {
            Err(RegistryError::InvalidInstruction.into())
        }
    }
}