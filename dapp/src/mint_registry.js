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


/**
 * MintExtension
 */

 export class MintExtension {
    constructor(
        extension,
        mint,
        symbol,
        name,
    ) {
        this._extension = extension;
        this._mint = mint;
        this._symbol = symbol;
        this._name = name;
    }

    get extension() {
        return this._extension;
    }

    get mint() {
        return this._mint;
    }

    get symbol() {
        return this._symbol;
    }

    get name() {
        return this._name;
    }
 }

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
        return await connection.getMinimumBalanceForRentExemption(Layout.MintExtensionLayout.span);
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
        console.log("mint :", mint.toBase58());
        console.log("payer :", payer.toBase58());
        console.log("extAccount :", extAccount.toBase58());
        console.log("programID :", programID.toBase58());
        const dataLayout = BufferLayout.struct([
            BufferLayout.u8("i"),
            BufferLayout.blob(32,"mint"),
            BufferLayout.u8('symbol_len'),
            BufferLayout.blob(symbol.length,"symbol"),
            BufferLayout.u8('name_len'),
            BufferLayout.blob(name.length,"name"),
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
        console.log("symbol:", symbol);
        console.log("name:", name);
        const dataLayout = BufferLayout.struct([
            BufferLayout.u8("i"),
            BufferLayout.u8('symbol_len'),
            BufferLayout.blob(symbol.length,"symbol"),
            BufferLayout.u8('name_len'),
            BufferLayout.blob(name.length,"name"),
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
            programId: programID,
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
            programId: programID,
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
            space: Layout.MintExtensionLayout.span,
            programId: programID,
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
        await sendAndConfirmTransaction(connection, transaction, signers, {
            skipPreflight: false,
            commitment: 'recent',
            preflightCommitment: 'recent',
        });
        return new MintExtension(
            extAccount.publicKey.toBase58(),
            mint,
            symbol,
            name,
        );
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
    static async ModifyMint(
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
     * @param programID RegisterMint's address
     */
    static async CloseMint(
        connection,
        payer,
        extAccount,
        mint,
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

    static async GetMintExtension(
        connection,
        mint,
        programID,
    ) {
       
        let resp = await connection._rpcRequest('getProgramAccounts', [
            programID.toBase58(),
            {
              encoding:'jsonParsed',
              commitment: 'recent',
                filters:[{"dataSize": 67},{"memcmp": {"offset": 1, "bytes": mint.toBase58()}}]
            }
        ])
        if (resp.result && resp.result.length > 0 ) {
            let exts = [];
            resp.result.forEach( result =>{
                const account = result.account;
                const data = account.data[0];
                const b = Buffer.from(data, 'base64');
                const p = new PublicKey(b.slice(1,33));
                let l = b.slice(33,34)[0];
                const s = b.slice(34,34+l).toString();
                l = b.slice(50,51)[0];
                const n = b.slice(51,51+l).toString();

                const ext = new MintExtension(result.pubkey, p.toBase58(),s,n);
                exts.push(ext);
            });
            return exts;
        } else {
            return null;
        }
    }
}
  