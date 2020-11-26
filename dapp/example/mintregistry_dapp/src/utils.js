import nacl from 'tweetnacl'
import { Account} from '@solana/web3.js';
import * as bip32 from 'bip32';

async function mnemonicToSeed(mnemonic) {
    const bip39 = await import('bip39');
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid seed words');
    }
    const seed = await bip39.mnemonicToSeed(mnemonic);
    return Buffer.from(seed).toString('hex');
}

function getAccountFromSeed(seed) {
    const derivedSeed = bip32
      .fromSeed(seed)
      .derivePath("m/501'/0'/0/0").privateKey;
    return new Account(nacl.sign.keyPair.fromSeed(derivedSeed).secretKey);
}

export async function mnemonicToSecretKey(mnemonic) {
    const { mnemonicToSeed } = await import('bip39');
    const rootSeed = Buffer.from(await mnemonicToSeed(mnemonic), 'hex');
    const derivedSeed = bip32.fromSeed(rootSeed).derivePath("m/501'/0'/0/0")
      .privateKey;
    return nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
}