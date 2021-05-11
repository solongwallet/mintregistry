// @flow

import * as BufferLayout from 'buffer-layout';

/**
 * Layout for a public key
 */
export function publicKey(property) {
    return BufferLayout.blob(32, property);
}

/**
 * Layout for a 64bit unsigned value
 */
 export function uint64(property){
    return BufferLayout.blob(8, property);
};
  

/**
 * Layout for MintExtension
 */

export const MintExtensionLayout = BufferLayout.struct([
    publicKey('mint_authority'),
    publicKey('freeze_authority'),
    BufferLayout.u8('isInitialized'),
    uint64(8,'supply'), 
    BufferLayout.u8('decimals'),
    publicKey('mint'),
    BufferLayout.u8('symbolLength'),
    BufferLayout.blob(16,'symbol'), 
    BufferLayout.u8('nameLength'),
    BufferLayout.blob(16,'name'), 
]);
