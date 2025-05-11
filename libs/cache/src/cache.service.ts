import { Inject, Injectable } from '@nestjs/common';
import { GlideClient, Transaction } from '@valkey/valkey-glide';
import { VALKEY_CONNECTION } from './cache-connection-symbol';

@Injectable()
export class CacheService {
  protected cache: GlideClient;
  protected transaction: Transaction;

  constructor(@Inject(VALKEY_CONNECTION) _cache: GlideClient) {
    this.cache = _cache;
  }

  getTransaction() {
    this.transaction = new Transaction();
  }
}
