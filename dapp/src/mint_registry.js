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
import bs58 from 'bs58';
import {u64} from '@solana/spl-token'
import {OldMints} from './mintext_snapshot'

/**
 * MintExtension
 */

 export function intFromBytes(byteArr) {
    let ret = 0;
    byteArr.forEach((val, i) => { ret += val * 256 ** i; });
    return ret;
}

 export class MintExtension {
    constructor(
        extension,
        mint_authority,
        freeze_authority,
        supply,
        decimals,
        mint,
        symbol,
        name,
    ) {
        this._extension = extension;
        this._mint_authority = mint_authority;
        this._freeze_authority = freeze_authority;
        this._supply = supply;
        this._decimals = decimals;
        this._mint = mint;
        this._symbol = symbol;
        this._name = name;
    }

    get extension() {
        return this._extension;
    }

    get mint_authority() {
        return this._mint_authority;
    }

    get freeze_authority() {
        return this._freeze_authority;
    }

    get supply() {
        return this._supply;
    }

    get decimals() {
        return this._decimals;
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
        mint_authority,
        freeze_authority,
        supply,
        decimals,
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
            BufferLayout.blob(32,"mint_authority"),
            BufferLayout.blob(32,"freeze_authority"),
            BufferLayout.blob(8,"supply"),
            BufferLayout.u8("decimals"),
            BufferLayout.blob(32,"mint"),
            BufferLayout.u8('symbol_len'),
            BufferLayout.blob(symbol.length,"symbol"),
            BufferLayout.u8('name_len'),
            BufferLayout.blob(name.length,"name"),
        ]);
      
        const data = Buffer.alloc(dataLayout.span);
        const supplyBuffer = Buffer.alloc(8);
        supplyBuffer.set(new u64(supply).toBuffer(),0);
        dataLayout.encode(
            {
              i:1, // register mint instruction
              mint_authority:mint_authority.toBuffer(),
              freeze_authority:freeze_authority.toBuffer(),
              supply:supplyBuffer,
              decimals: decimals,
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
        mint_authority,
        freeze_authority,
        supply,
        decimals,
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
            mint_authority,
            freeze_authority,
            supply,
            decimals,
            mint,
            symbol,
            name,
            payer.publicKey,
            extAccount.publicKey,
            programID,
        );
        console.log("mint_authority:", mint_authority.toBase58())
        console.log("supply:", supply)

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

    /**
     * Get extension for Mint.
     *
     * @param connection The connection to use
     * @param mint the mint 
     * @param programID RegisterMint's address
     */
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
                filters:[{"dataSize": 140},{"memcmp": {"offset": 1+73, "bytes": mint.toBase58()}}]
            }
        ])
        if (resp.result && resp.result.length > 0 ) {
            let exts = [];
            resp.result.forEach( result =>{
                const account = result.account;
                const data = account.data[0];
                const b = Buffer.from(data, 'base64');
                const ma = new PublicKey(b.slice(0,32));
                const fa = new PublicKey(b.slice(32,64));
                const supply = intFromBytes(b.slice(64,72));
                const decimals = b.slice(72,73)[0];

                const p = new PublicKey(b.slice(74,106));
                let l = b.slice(106,107)[0];
                const s = b.slice(107,107+l).toString();
                l = b.slice(123,124)[0];
                const n = b.slice(124,124+l).toString();

                const ext = new MintExtension(result.pubkey, ma.toBase58(), fa.toBase58(), supply, decimals, p.toBase58(),s,n);
                exts.push(ext);
            });
            return exts;
        } else {
            return null;
        }
    }

    /**
     * Get extension for Mint with SYMBOL.
     *
     * @param connection The connection to use
     * @param symbol symbol for the mint 
     * @param programID RegisterMint's address
     */
    static async GetMintExtensionBySymbol(
        connection,
        symbol,
        programID,
    ) {
        const symbolBuf = Buffer.from(symbol)
        const filter = bs58.encode(symbolBuf)
        let resp = await connection._rpcRequest('getProgramAccounts', [
            programID.toBase58(),
            {
              encoding:'jsonParsed',
              commitment: 'recent',
                filters:[{"dataSize": 140},{"memcmp": {"offset": 34+73, "bytes": filter}}]
            }
        ])
        if (resp.result && resp.result.length > 0 ) {
            let exts = [];
            resp.result.forEach( result =>{
                const account = result.account;
                const data = account.data[0];
                const b = Buffer.from(data, 'base64');

                const ma = new PublicKey(b.slice(0,32));
                const fa = new PublicKey(b.slice(32,64));
                const supply = intFromBytes(b.slice(64,72));
                const decimals = b.slice(72,73)[0];

                const p = new PublicKey(b.slice(74,106));
                let l = b.slice(106,107)[0];
                const s = b.slice(107,107+l).toString();
                l = b.slice(123,124)[0];
                const n = b.slice(124,124+l).toString();

                const ext = new MintExtension(result.pubkey, ma.toBase58(), fa.toBase58(), supply, decimals, p.toBase58(),s,n);
                exts.push(ext);
            });
            return exts;
        } else {
            return null;
        }
    }


    /**
     * Get extension for Mint with mint authority.
     *
     * @param connection The connection to use
     * @param mintAuthority mintAuthoritysymbol for the mint 
     * @param programID RegisterMint's address
     */
     static async GetMintExtensionByMintAuthority(
        connection,
        mintAuthority,
        programID,
    ) {
        let resp = await connection._rpcRequest('getProgramAccounts', [
            programID.toBase58(),
            {
              encoding:'jsonParsed',
              commitment: 'recent',
                filters:[{"dataSize": 140},{"memcmp": {"offset": 0, "bytes": mintAuthority.toBase58()}}]
            }
        ])
        if (resp.result && resp.result.length > 0 ) {
            let exts = [];
            resp.result.forEach( result =>{
                const account = result.account;
                const data = account.data[0];
                const b = Buffer.from(data, 'base64');

                const ma = new PublicKey(b.slice(0,32));
                const fa = new PublicKey(b.slice(32,64));
                const supply = intFromBytes(b.slice(64,72));
                const decimals = b.slice(72,73)[0];

                const p = new PublicKey(b.slice(74,106));
                let l = b.slice(106,107)[0];
                const s = b.slice(107,107+l).toString();
                l = b.slice(123,124)[0];
                const n = b.slice(124,124+l).toString();

                const ext = new MintExtension(result.pubkey, ma.toBase58(), fa.toBase58(), supply, decimals, p.toBase58(),s,n);
                exts.push(ext);
            });

            OldMints.forEach(m =>{
                if (m.mintAuthority == mintAuthority.toBase58()) {
                    const ext = new MintExtension("",m.mintAuthority, m.freezeAuthority,0,m.decimals,m.mint,m.symbol, m.name);
                    exts.push(ext);
                }
            })

            return exts;
        } else {
            return null;
        }
    }
}
  