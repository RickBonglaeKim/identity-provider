import { Injectable } from '@nestjs/common';
import * as jose from 'jose';
import * as type from '../../type/keypair.type';

@Injectable()
export class KeypairService {
  async generateKeypairJWK(): Promise<type.KeypairJWK> {
    const { publicKey, privateKey } = await jose.generateKeyPair('RS256', {
      extractable: true,
    });
    const publicJWK = await jose.exportJWK(publicKey);
    const privateJWK = await jose.exportJWK(privateKey);
    return { publicJWK, privateJWK };
  }
}
