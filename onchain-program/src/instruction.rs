//! Instruction types

use crate::error::RegistryError;
use solana_program::{
    instruction::{AccountMeta, Instruction},
    program_error::ProgramError,
    //program_option::COption,
    pubkey::Pubkey,
    info,
    //sysvar,
};
//use std::convert::TryInto;
use std::mem::size_of;
use std::str::from_utf8;

/// Instructions supported by the mint-registry program.
#[repr(C)]
#[derive(Clone, Debug, PartialEq)]
pub enum RegistryInstruction {
    /// Register  a new mint extension for a mint
    /// with a SYMBOL 
    /// and a NAME
    /// echo should be a string which length < 16
    RegisterMint {
        /// mint is the address for a mint 
        mint: Pubkey,
        /// symbol is a symbol for a mint
        symbol: String,
        /// name is a name for amint
        name: String,
    },

    /// CloseMint delete a Mint extension
    CloseMint ,

    /// Modify to modify an exist Mint extension
    ModifyMint {
        /// symbol is a symbol for a mint
        symbol: String,
        /// name is a name for amint
        name: String,
    }
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
                Self::RegisterMint{
                    mint,
                    symbol,
                    name,
                }
            },
            2 => Self::CloseMint,
            3 => {
                let (&len, rest) = rest.split_first().ok_or(InvalidInstruction)?;
                let (symbol_buf, rest) = rest.split_at(len.into());
                let symbol = String::from(from_utf8(symbol_buf).unwrap());
                let (&len, rest) = rest.split_first().ok_or(InvalidInstruction)?;
                let (name_buf, _rest) = rest.split_at(len.into());
                let name = String::from(from_utf8(name_buf).unwrap());
                Self::ModifyMint{
                    symbol,
                    name,
                }
            }
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

    /// Packs a [RegistryInstruction](enum.RegistryInstruction.html) into a byte buffer.
    pub fn pack(&self) -> Vec<u8> {
        let mut buf : Vec<u8>;
        let self_len= size_of::<Self>();
        match self {
            &Self::RegisterMint {
                ref mint,
                ref symbol,
                ref name,
            } => {
                buf = Vec::with_capacity(self_len+1+1+1);
                buf.push(1); // tag
                buf.extend_from_slice(mint.as_ref());
                buf.push(symbol.len() as u8);
                buf.extend_from_slice(symbol.as_bytes());
                buf.push(name.len() as u8);
                buf.extend_from_slice(name.as_ref());
            }
            Self::CloseMint => {
                buf = Vec::with_capacity(self_len);
                buf.push(2); //tag
            }
            &Self::ModifyMint {
                ref symbol,
                ref name,
            } => {
                buf = Vec::with_capacity(self_len+1+1+1);
                buf.push(3); // tag
                buf.push(symbol.len() as u8);
                buf.extend_from_slice(symbol.as_bytes());
                buf.push(name.len() as u8);
                buf.extend_from_slice(name.as_ref());
            }
        };
        buf
    }    
}

/// register_mint_instruction create a RegisterMint instruction
pub fn register_mint_instruction(
    program_id: &Pubkey,
    mint_key: &Pubkey,
    symbol: String,
    name: String,
    payer_key: &Pubkey,
    mintext_key: &Pubkey,
    signer_pubkeys: &[&Pubkey],
) -> Result<Instruction, ProgramError> {
    info!("register_mint_instruction");
    let data = RegistryInstruction::RegisterMint { 
        mint:*mint_key,
        symbol,
        name,
     }.pack();

    let mut accounts = Vec::with_capacity(3 + signer_pubkeys.len());
    accounts.push(AccountMeta::new(*mint_key, false));
    accounts.push(AccountMeta::new(*payer_key, true));
    accounts.push(AccountMeta::new(*mintext_key, true));
    for signer_pubkey in signer_pubkeys.iter() {
        accounts.push(AccountMeta::new_readonly(**signer_pubkey, true));
    }

    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data,
    })
}

/// modify_mint_instruction modify a RegisterMint instruction
pub fn modify_mint_instruction(
    program_id: &Pubkey,
    mint_key: &Pubkey,
    symbol: String,
    name: String,
    payer_key: &Pubkey,
    mintext_key: &Pubkey,
    signer_pubkeys: &[&Pubkey],
) -> Result<Instruction, ProgramError> {
    info!("modify_mint_instruction");
    let data = RegistryInstruction::ModifyMint { 
        symbol,
        name,
     }.pack();

    let mut accounts = Vec::with_capacity(3 + signer_pubkeys.len());
    accounts.push(AccountMeta::new(*mint_key, false));
    accounts.push(AccountMeta::new(*payer_key, true));
    accounts.push(AccountMeta::new(*mintext_key, true));
    for signer_pubkey in signer_pubkeys.iter() {
        accounts.push(AccountMeta::new_readonly(**signer_pubkey, true));
    }

    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data,
    })
}

/// close_mint_instruction modify a RegisterMint instruction
pub fn close_mint_instruction(
    program_id: &Pubkey,
    mint_key: &Pubkey,
    payer_key: &Pubkey,
    mintext_key: &Pubkey,
    signer_pubkeys: &[&Pubkey],
) -> Result<Instruction, ProgramError> {
    info!("close_mint_instruction");
    let data = RegistryInstruction::CloseMint.pack();

    let mut accounts = Vec::with_capacity(3 + signer_pubkeys.len());
    accounts.push(AccountMeta::new(*mintext_key, true));
    accounts.push(AccountMeta::new(*payer_key, true));
    accounts.push(AccountMeta::new(*mint_key, false));
    for signer_pubkey in signer_pubkeys.iter() {
        accounts.push(AccountMeta::new_readonly(**signer_pubkey, true));
    }

    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data,
    })
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_instruction_register_mint() {
        let check = RegistryInstruction::RegisterMint{
            mint: Pubkey::new(&[1u8;32]),
            symbol: String::from(""),
            name: String::from(""),
        };
        let packed = check.pack();
        let mut expect = Vec::new();
        expect.extend_from_slice(&[1]);
        expect.extend_from_slice(&[1u8;32]);
        expect.extend_from_slice(&[0]);
        expect.extend_from_slice(&[0]);
        assert_eq!(packed, expect);
        let unpacked = RegistryInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, check); 

        let check = RegistryInstruction::RegisterMint{
            mint: Pubkey::new(&[2u8;32]),
            symbol: String::from("CZCOIN"),
            name: String::from("CZ's COIN"),
        };
        let packed = check.pack();
        let mut expect = Vec::new();
        expect.extend_from_slice(&[1]);
        expect.extend_from_slice(&[2u8;32]);
        let symbol = String::from("CZCOIN");
        let name= String::from("CZ's COIN");
        expect.extend_from_slice(&[symbol.len() as u8]);
        expect.extend_from_slice(symbol.as_bytes());
        expect.extend_from_slice(&[name.len() as u8]);
        expect.extend_from_slice(name.as_bytes());
        assert_eq!(packed, expect);
        let unpacked = RegistryInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, check); 


        let check = RegistryInstruction::RegisterMint{
            mint: Pubkey::new(&[2u8;32]),
            symbol: String::from(""),
            name: String::from("CZ's COIN"),
        };
        let packed = check.pack();
        let mut expect = Vec::new();
        expect.extend_from_slice(&[1]);
        expect.extend_from_slice(&[2u8;32]);
        let symbol = String::from("");
        let name= String::from("CZ's COIN");
        expect.extend_from_slice(&[symbol.len() as u8]);
        expect.extend_from_slice(symbol.as_bytes());
        expect.extend_from_slice(&[name.len() as u8]);
        expect.extend_from_slice(name.as_bytes());
        assert_eq!(packed, expect);
        let unpacked = RegistryInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, check);

        let check = RegistryInstruction::RegisterMint{
            mint: Pubkey::new(&[2u8;32]),
            symbol: String::from("CZCOIN"),
            name: String::from(""),
        };
        let packed = check.pack();
        let mut expect = Vec::new();
        expect.extend_from_slice(&[1]);
        expect.extend_from_slice(&[2u8;32]);
        let symbol = String::from("CZCOIN");
        let name= String::from("");
        expect.extend_from_slice(&[symbol.len() as u8]);
        expect.extend_from_slice(symbol.as_bytes());
        expect.extend_from_slice(&[name.len() as u8]);
        expect.extend_from_slice(name.as_bytes());
        assert_eq!(packed, expect);
        let unpacked = RegistryInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, check);
    }

    #[test]
    fn test_instruction_modify_mint() {
        let check = RegistryInstruction::ModifyMint{
            symbol: String::from(""),
            name: String::from(""),
        };
        let packed = check.pack();
        let mut expect = Vec::new();
        expect.extend_from_slice(&[3]);
        expect.extend_from_slice(&[0]);
        expect.extend_from_slice(&[0]);
        assert_eq!(packed, expect);
        let unpacked = RegistryInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, check); 

        let check = RegistryInstruction::ModifyMint{
            symbol: String::from("CZCOIN"),
            name: String::from("CZ's COIN"),
        };
        let packed = check.pack();
        let mut expect = Vec::new();
        expect.extend_from_slice(&[3]);
        let symbol = String::from("CZCOIN");
        let name= String::from("CZ's COIN");
        expect.extend_from_slice(&[symbol.len() as u8]);
        expect.extend_from_slice(symbol.as_bytes());
        expect.extend_from_slice(&[name.len() as u8]);
        expect.extend_from_slice(name.as_bytes());
        assert_eq!(packed, expect);
        let unpacked = RegistryInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, check); 

        let check = RegistryInstruction::ModifyMint{
            symbol: String::from(""),
            name: String::from("CZ's COIN"),
        };
        let packed = check.pack();
        let mut expect = Vec::new();
        expect.extend_from_slice(&[3]);
        let symbol = String::from("");
        let name= String::from("CZ's COIN");
        expect.extend_from_slice(&[symbol.len() as u8]);
        expect.extend_from_slice(symbol.as_bytes());
        expect.extend_from_slice(&[name.len() as u8]);
        expect.extend_from_slice(name.as_bytes());
        assert_eq!(packed, expect);
        let unpacked = RegistryInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, check); 

        let check = RegistryInstruction::ModifyMint{
            symbol: String::from("CZCOIN"),
            name: String::from(""),
        };
        let packed = check.pack();
        let mut expect = Vec::new();
        expect.extend_from_slice(&[3]);
        let symbol = String::from("CZCOIN");
        let name= String::from("");
        expect.extend_from_slice(&[symbol.len() as u8]);
        expect.extend_from_slice(symbol.as_bytes());
        expect.extend_from_slice(&[name.len() as u8]);
        expect.extend_from_slice(name.as_bytes());
        assert_eq!(packed, expect);
        let unpacked = RegistryInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, check); 
    }

    #[test]
    fn test_instruction_close_mint() {
        let check = RegistryInstruction::CloseMint;
        let packed = check.pack();
        let mut expect = Vec::new();
        expect.extend_from_slice(&[2]);
        assert_eq!(packed, expect);
        let unpacked = RegistryInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, check); 
    }
}