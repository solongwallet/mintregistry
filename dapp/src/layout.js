// @flow

import * as BufferLayout from 'buffer-layout';

/**
 * Layout for a public key
 */
export function publicKey(property) {
    return BufferLayout.blob(32, property);
}

