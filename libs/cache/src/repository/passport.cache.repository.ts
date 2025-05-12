import { Injectable } from '@nestjs/common';
import { CacheService } from '@app/cache/service/cache.service';
import {
  Decoder,
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
    return new CacheResponseEntity<string>(false);
  }

  setPassportWithTransaction(
    transaction: Transaction,
    key: string,
    data: string,
  ): Transaction {
    return transaction.set(key, data, this.createSetOption());
  }

  async getPassport(key: string): Promise<CacheResponseEntity<string>> {
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

  async deletePassport(key: string): Promise<CacheResponseEntity<number>> {
    const result: number = await this.cache.del([key]);
    return new CacheResponseEntity<number>(result === 1, result);
  }

  deletePassportWithTransaction(
    transaction: Transaction,
    key: string,
  ): Transaction {
    return transaction.del([key]);
  }
}
