/**
 * @flow
 */

import * as BufferLayout from 'buffer-layout';
import * as Layout from './layout';
import { Connection,
    Transaction,
    PublicKey,
    SystemProgram,
    TransactionInstruction,
    sendAndConfirmTransaction,
    Account} from "@solana/web3.js"

export const MintExtensionLayout = BufferLayout.struct([
    Layout.publicKey('isInitialized'),
    BufferLayout.u8('symbolLength'),
    Layout.publicKey('mint'),
    BufferLayout.u8('symbolLength'),
    BufferLayout.blob(16,'symbol'), 
    BufferLayout.u8('nameLength'),
    BufferLayout.blob(16,'name'), 
]);


/**
 * MintRegistry
 */
export class MintRegistry {


    /**
     * Get the minimum balance for the mint extension to be rent exempt
     *
     * @return Number of lamports required
     */
    static async getMinBalanceRentForExemptMintExtension(
        connection
    ) {
        return await connection.getMinimumBalanceForRentExemption(MintLayout.span);
    }

    /**
     * Construct an RegisterMint instruction
     *
     * @param mint mint account
     * @param symbol symbol of mint
     * @param name name of mint
     * @param payer payer account 
     * @param extAccount mint extension account
     * @param programID SPL Token program account
     */
    static createRegisterMintInstruction(
        mint,
        symbol,
        name,
        payer,
        extAccount,
        programID,
    ) {

        const dataLayout = BufferLayout.struct([
            BufferLayout.u8("i"),
            BufferLayout.blob(32,"mint"),
            BufferLayout.u8('symbol_len'),
            BufferLayout.blob(6,"symbol"),
            BufferLayout.u8('name_len'),
            BufferLayout.blob(6,"name"),
        ]);
      
        const data = Buffer.alloc(dataLayout.span);
        dataLayout.encode(
            {
              i:1, // register mint instruction
              mint: mint.toBuffer(), 
              symbol_len:symbol.length,
              symbol:Buffer.from(symbol, 'utf8'),
              name_len:name.length,
              name:Buffer.from(name, 'utf8'),
            },
            data,
        );
      
        let keys = [
            {pubkey: mint, isSigner: false, isWritable: true},
            {pubkey: payer, isSigner: true, isWritable: true},
            {pubkey: extAccount, isSigner: true, isWritable: true},
        ];

        const  trxi = new TransactionInstruction({
            keys,
            programId: programID,
            data,
        });
        return trxi;
    }

    /**
     * Construct an ModifyMint instruction
     *
     * @param mint mint account
     * @param symbol symbol of mint
     * @param name name of mint
     * @param payer payer account 
     * @param extAccount mint extension account
     * @param programID SPL Token program account
     */
    static createModifyMintInstruction(
        mint,
        symbol,
        name,
        payer,
        extAccount,
        programID,
    ) {
        const dataLayout = BufferLayout.struct([
            BufferLayout.u8("i"),
            BufferLayout.u8('symbol_len'),
            BufferLayout.blob(6,"symbol"),
            BufferLayout.u8('name_len'),
            BufferLayout.blob(6,"name"),
        ]);
      
        const data = Buffer.alloc(dataLayout.span);
        dataLayout.encode(
            {
                i:3, // modify mint instruction
                symbol_len:symbol.length,
                symbol:Buffer.from(symbol, 'utf8'),
                name_len:name.length,
                name:Buffer.from(name, 'utf8'),
            },
            data,
        );
      
        let keys = [
            {pubkey: mint, isSigner: false, isWritable: true},
            {pubkey: payer, isSigner: true, isWritable: true},
            {pubkey: extAccount, isSigner: false, isWritable: true},
        ];

        const  trxi = new TransactionInstruction({
            keys,
            programId: new PublicKey(programID),
            data,
        });
        return trxi;
    }

    /**
     * Construct an CloseMint instruction
     *
     * @param mint mint account
     * @param payer payer account 
     * @param extAccount mint extension account
     * @param programID SPL Token program account
     */
    static createCloseMintInstruction(
        mint,
        payer,
        extAccount,
        programID,
    ) {

        const dataLayout = BufferLayout.struct([
            BufferLayout.u8("i"),
        ]);
      
        const data = Buffer.alloc(dataLayout.span);
            dataLayout.encode(
            {
                i:2, // close mint instruction
            },
            data,
        );
      
        let keys = [
            {pubkey: extAccount, isSigner: false, isWritable: true},
            {pubkey: payer, isSigner: true, isWritable: true},
            {pubkey: mint, isSigner: false, isWritable: true},
        ];

        const  trxi = new TransactionInstruction({
            keys,
            programId: new PublicKey(programID),
            data,
        });
        return trxi;
    }


    /**
     * Regist an extension for Mint.
     *
     * @param connection The connection to use
     * @param payer Fee payer and mint maker for transaction
     * @param mint the mint 
     * @param symbol symbol for mint
     * @param name  name for mint
     * @param programID RegisterMint's address
     */
    static async RegisterMint(
        connection,
        payer,
        mint,
        symbol,
        name,
        programID,
    ){
        const extAccount = new Account();
        const balanceNeeded = await this.getMinBalanceRentForExemptMintExtension(connection);

        const trxi0 =  SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: extAccount.publicKey,
            lamports: balanceNeeded,
            space: MintLayout.span,
            programId: new PublicKey(programID),
        });

        const trxi1 = this.createRegisterMintInstruction(
            mint,
            symbol,
            name,
            payer.publicKey,
            extAccount.publicKey,
            programID,
        );

        const transaction = new Transaction();
        transaction.add(trxi0);
        transaction.add(trxi1);

        let signers= [payer, extAccount];
        return sendAndConfirmTransaction(connection, transaction, signers, {
            skipPreflight: false,
            commitment: 'recent',
            preflightCommitment: 'recent',
        });
    }

    /**
     * Modify an extension for Mint.
     *
     * @param connection The connection to use
     * @param payer Fee payer and mint maker for transaction
     * @param extAccount mint extension account 
     * @param mint the mint 
     * @param symbol symbol for mint
     * @param name  name for mint
     * @param programID RegisterMint's address
     */
    static async RegisterMint(
        connection,
        payer,
        extAccount,
        mint,
        symbol,
        name,
        programID,
    ){
        const trxi0 = this.createModifyMintInstruction(
            mint,
            symbol,
            name,
            payer.publicKey,
            extAccount,
            programID,
        );

        const transaction = new Transaction();
        transaction.add(trxi0);

        let signers= [payer];
        return sendAndConfirmTransaction(connection, transaction, signers, {
            skipPreflight: false,
            commitment: 'recent',
            preflightCommitment: 'recent',
        });
    }

    /**
     * Close an extension for Mint.
     *
     * @param connection The connection to use
     * @param payer Fee payer and mint maker for transaction
     * @param extAccount mint extension account 
     * @param mint the mint 
     * @param symbol symbol for mint
     * @param name  name for mint
     * @param programID RegisterMint's address
     */
    static async RegisterMint(
        connection,
        payer,
        extAccount,
        mint,
        symbol,
        name,
        programID,
    ){
        const trxi0 = this.createCloseMintInstruction(
            mint,
            payer.publicKey,
            extAccount,
            programID,
        );

        const transaction = new Transaction();
        transaction.add(trxi0);

        let signers= [payer];
        return sendAndConfirmTransaction(connection, transaction, signers, {
            skipPreflight: false,
            commitment: 'recent',
            preflightCommitment: 'recent',
        });        
    }
}
  