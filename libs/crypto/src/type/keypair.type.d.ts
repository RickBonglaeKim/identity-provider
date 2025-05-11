import * as jose from 'jose';

type keypairJWK = Record<'privateJWK' | 'publicJWK', jose.JWK>;
