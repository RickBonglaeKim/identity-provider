import { Injectable } from '@nestjs/common';
import { CacheService } from '@app/cache/cache.service';
import {
  Decoder,
  DecoderOption,
  GlideString,
  SetOptions,
  TimeUnit,
  Transaction,
} from '@valkey/valkey-glide';
import { CacheResponseEntity } from '../entity/cache.response.entity';

@Injectable()
export class PassportCacheRepository extends CacheService {

  private createSetOption(): SetOptions {
    return {
      expiry: { type: TimeUnit.Milliseconds, count: 1000 * 60 * 60 },
      conditionalSet: 'onlyIfDoesNotExist',
      returnOldValue: false,
    };
  }

  async setPassport(
    key: string,
    data: string,
  ): Promise<CacheResponseEntity<string>> {
    const result = await this.cache.set(key, data, this.createSetOption());
    if (result === 'OK')
      return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false, result?.toString());
  }

  setPassportWithTransaction(
    transaction: Transaction,
    key: string,
    data: string,
  ): Transaction {
    return transaction.set(key, data, this.createSetOption());
  }

  async getPassport(
    key: string,
  ): Promise<CacheResponseEntity<string | undefined>> {
    const result = await this.cache.get(key, { decoder: Decoder.String });
    if (result) return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  getPassportWithTransaction(
    transaction: Transaction,
    key: string,
  ): Transaction {
    return transaction.get(key);
  }
}
