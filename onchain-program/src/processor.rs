//! Program state processor

use crate::{
    error::RegistryError,
    instruction::{RegistryInstruction},
    state::{MintExtension, Mint},
};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    //decode_error::DecodeError,
    program_error::ProgramError,
    entrypoint::ProgramResult,
    info,
    program_option::COption,
    //program_pack::{IsInitialized, Pack},
    program_pack::{Pack},
    pubkey::Pubkey,
    //sysvar::{rent::Rent, Sysvar},
    //sysvar::{rent::Rent},
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
                info!("mint-registry: Instruction: RegisterMint");
                Self::process_register_mint(accounts, mint, symbol, name)
            }
            RegistryInstruction::CloseMint=>{
                info!("mint-registry: Instruction: CloseMint");
                Self::process_close_mint(accounts)
            }
            RegistryInstruction::ModifyMint {
                symbol,
                name,
            } => {
                info!("mint-registry: Instruction: ModifyMint");
                Self::process_modify_mint(accounts, symbol, name)
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
        info!("process_register_mint");
        if symbol.len()>=16 || name.len()>=16 {
            return Err(RegistryError::SymbolToLong.into());
        }
        let account_info_iter = &mut accounts.iter();
        let mint_account_info = next_account_info(account_info_iter)?;
        info!("mint_account_info");
        let mint_account = Mint::unpack_unchecked(&mint_account_info.data.borrow())?;
        info!("mint_account");

        let mint_owner_info = next_account_info(account_info_iter)?;
        let mint_ext_info= next_account_info(account_info_iter)?;

        // check permission
        if !mint_owner_info.is_signer || !mint_ext_info.is_signer{
            return Err(ProgramError::MissingRequiredSignature);
        }
        match mint_account.mint_authority {
            COption::Some(mint_authority) => {
                if mint_authority != *mint_owner_info.key {
                    return Err(RegistryError::NoAuthority.into());
                } 
            },
            COption::None => return Err(RegistryError::NoMintAuthority.into()),
        }
        

        let mut mint_ext = MintExtension::unpack_unchecked(&mint_ext_info.data.borrow())?;
        if mint_ext.is_initialized {
            return Err(RegistryError::AlreadRegistry.into());
        }
        mint_ext.is_initialized = true;
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

    /// Processes a [CloseMint](enum.RegistryInstruction.html) instruction.
    pub fn process_close_mint(accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();

        let source_account_info = next_account_info(account_info_iter)?;
        let dest_account_info = next_account_info(account_info_iter)?;
        let mint_account_info= next_account_info(account_info_iter)?;
        let mint_account = Mint::unpack_unchecked(&mint_account_info.data.borrow())?;
        let mut source_account = MintExtension::unpack_unchecked(&source_account_info.data.borrow())?;

        //check permission
        if !dest_account_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }
        match mint_account.mint_authority {
            COption::Some(mint_authority) => {
                if mint_authority != *dest_account_info.key {
                    return Err(RegistryError::NoAuthority.into());
                } 
            },
            COption::None => return Err(RegistryError::NoMintAuthority.into()),
        }

        let dest_starting_lamports = dest_account_info.lamports();
        **dest_account_info.lamports.borrow_mut() = dest_starting_lamports
            .checked_add(source_account_info.lamports())
            .ok_or(RegistryError::Overflow)?;

        **source_account_info.lamports.borrow_mut() = 0;
        source_account.is_initialized = false;
        MintExtension::pack(source_account, &mut source_account_info.data.borrow_mut())?;

        Ok(())
    }

    /// Processes an [ModifyMint](enum.RegistryInstruction.html) instruction.
    fn process_modify_mint(
        accounts: &[AccountInfo],
        symbol: String,
        name: String,
    ) -> ProgramResult {
        if symbol.len()>=16 || name.len()>=16 {
            return Err(RegistryError::SymbolToLong.into());
        }
        let account_info_iter = &mut accounts.iter();
        let mint_account_info = next_account_info(account_info_iter)?;
        let mint_account = Mint::unpack_unchecked(&mint_account_info.data.borrow())?;
        let mint_owner_info = next_account_info(account_info_iter)?;
        let mint_ext_info= next_account_info(account_info_iter)?;

        // check permission
        if !mint_owner_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }
        match mint_account.mint_authority {
            COption::Some(mint_authority) => {
                if mint_authority != *mint_owner_info.key {
                    return Err(RegistryError::NoAuthority.into());
                } 
            },
            COption::None => return Err(RegistryError::NoMintAuthority.into()),
        }
        

        let mut mint_ext = MintExtension::unpack_unchecked(&mint_ext_info.data.borrow())?;
        if !mint_ext.is_initialized {
            return Err(RegistryError::NoRegistry.into()); 
        }
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

#[cfg(test)]
mod tests {
    use super::*;

    use crate::instruction::*;
    //use solana_program::{clock::Epoch, instruction::Instruction, sysvar::rent};
    use solana_program::{instruction::Instruction, sysvar::{rent::Rent}};
    use solana_sdk::account::{
        //create_account, create_is_signer_account_infos, Account,
        create_is_signer_account_infos, Account,
    };

    fn do_process_instruction(
        instruction: Instruction,
        accounts: Vec<&mut Account>,
    ) -> ProgramResult {
        let mut meta = instruction
            .accounts
            .iter()
            .zip(accounts)
            .map(|(account_meta, account)| (&account_meta.pubkey, account_meta.is_signer, account))
            .collect::<Vec<_>>();

        let account_infos = create_is_signer_account_infos(&mut meta);
        Processor::process(&instruction.program_id, &account_infos, &instruction.data)
    }

    // fn do_process_instruction_dups(
    //     instruction: Instruction,
    //     account_infos: Vec<AccountInfo>,
    // ) -> ProgramResult {
    //     Processor::process(&instruction.program_id, &account_infos, &instruction.data)
    // }

    fn mintext_minimum_balance() -> u64 {
        Rent::default().minimum_balance(MintExtension::get_packed_len())
    }

    fn mint_minimum_balance() -> u64 {
        Rent::default().minimum_balance(Mint::get_packed_len())
    }

    #[test]
    fn test_register_mint() {
        let program_id = Pubkey::new_unique();
        let symbol = String::from("SYM");
        let name = String::from("name of mint");
        let pay_key = Pubkey::new_unique();
        let mut pay_account = Account::default();

        let mint_key = Pubkey::new_unique();
        let mint_account_state = Mint {
            mint_authority: COption::Some(pay_key),
            supply: 0,
            decimals:6,
            is_initialized: true,
            freeze_authority: COption::None,
        };
        let mut data:[u8;82] = [0;82];
        mint_account_state.pack_into_slice(&mut data);
        let mut mint_account= Account::new(mint_minimum_balance(), Mint::get_packed_len(), &program_id);
        mint_account.data = data.to_vec();

        let mint_ext_key = Pubkey::new_unique();
        let mut mint_ext_account= Account::new(mintext_minimum_balance(), MintExtension::get_packed_len(), &program_id);



        do_process_instruction(
            register_mint_instruction(
                &program_id,
                &mint_key, 
                symbol, 
                name,
                &pay_key,
                &mint_ext_key,
                &[],
            ).unwrap(),
            vec![&mut mint_account, &mut pay_account,&mut mint_ext_account],
        ).unwrap();
    }

}