import * as jose from 'jose';

export type KeypairJWK = Record<'privateJWK' | 'publicJWK', jose.JWK>;
