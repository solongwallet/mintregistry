// @flow

import * as BufferLayout from 'buffer-layout';

/**
 * Layout for a public key
 */
export function publicKey(property) {
    return BufferLayout.blob(32, property);
}


/**
 * Layout for MintExtension
 */

export const MintExtensionLayout = BufferLayout.struct([
    BufferLayout.u8('isInitialized'),
    publicKey('mint'),
    BufferLayout.u8('symbolLength'),
    BufferLayout.blob(16,'symbol'), 
    BufferLayout.u8('nameLength'),
    BufferLayout.blob(16,'name'), 
]);
