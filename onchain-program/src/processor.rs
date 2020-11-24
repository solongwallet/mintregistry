//! Program state processor

use crate::{
    error::RegistryError,
    instruction::{RegistryInstruction},
    state::{MintExtension, Mint},
};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    //decode_error::DecodeError,
    entrypoint::ProgramResult,
    info,
    program_option::COption,
    //program_pack::{IsInitialized, Pack},
    program_pack::{Pack},
    pubkey::Pubkey,
    //sysvar::{rent::Rent, Sysvar},
};

/// Program state handler.
pub struct Processor {}
impl Processor {

    /// Processes an [Instruction](enum.Instruction.html).
    pub fn process(_program_id: &Pubkey, accounts: &[AccountInfo], input: &[u8]) -> ProgramResult {
        info!("mint_registry:process program:");
        let instruction = RegistryInstruction::unpack(input)?;

        match instruction {
            RegistryInstruction::RegisterMint {
                mint,
                symbol,
                name,
            } => {
                info!("mint-registry: Instruction: Extension");
                Self::process_register_mint(accounts, mint, symbol, name)
            }
        }
    }

    /// Processes an [RegisterMint](enum.RegistryInstruction.html) instruction.
    fn process_register_mint(
        accounts: &[AccountInfo],
        mint: Pubkey,
        symbol: String,
        name: String,
    ) -> ProgramResult {
        info!("mint-registry: process_register_mint");
        if symbol.len()>=16 || name.len()>=16 {
            return Err(RegistryError::SymbolToLong.into());
        }
        let account_info_iter = &mut accounts.iter();
        let mint_account_info = next_account_info(account_info_iter)?;
        let mint_account = Mint::unpack_unchecked(&mint_account_info.data.borrow())?;

        let mint_owner = next_account_info(account_info_iter)?;
        let mint_ext_info= next_account_info(account_info_iter)?;

        // check permission
        match mint_account.mint_authority {
            COption::Some(mint_authority) => {
                if mint_authority != *mint_owner.key {
                    return Err(RegistryError::NoAuthority.into());
                } 
            },
            COption::None => return Err(RegistryError::NoMintAuthority.into()),
        }
        

        let mut mint_ext = MintExtension::unpack_unchecked(&mint_ext_info.data.borrow())?;
        mint_ext.mint = mint;
        mint_ext.symbol_len = symbol.len() as u8;
        for  i in 0..symbol.len() {
            mint_ext.symbol[i] = symbol.as_bytes()[i];
        }
        mint_ext.name_len = name.len() as u8;
        for  i in 0..name.len() {
            mint_ext.name[i] = name.as_bytes()[i];
        }

        MintExtension::pack(mint_ext, &mut mint_ext_info.data.borrow_mut())?;

        Ok(())
    }
 
}