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
export class VerificationCacheRepository extends CacheService {
  private readonly prefix = 'verification';
  private createSetOption(): SetOptions {
    return {
      expiry: { type: TimeUnit.Milliseconds, count: 1000 * 60 * 5 },
      conditionalSet: 'onlyIfDoesNotExist',
      returnOldValue: false,
    };
  }

  async setVerificationCode(
    key: string,
    data: string,
  ): Promise<CacheResponseEntity<string>> {
    key = `${this.prefix}:${key}`;
    const result = await this.cache.set(key, data, this.createSetOption());
    if (result === 'OK')
      return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  setVerificationCodeWithTransaction(
    transaction: Transaction,
    key: string,
    data: string,
  ): Transaction {
    key = `${this.prefix}:${key}`;
    return transaction.set(key, data, this.createSetOption());
  }

  async getVerificationCode(key: string): Promise<CacheResponseEntity<string>> {
    key = `${this.prefix}:${key}`;
    const result = await this.cache.get(key, { decoder: Decoder.String });
    if (result) return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  async deleteVerificationCode(
    key: string,
  ): Promise<CacheResponseEntity<number>> {
    key = `${this.prefix}:${key}`;
    const result: number = await this.cache.del([key]);
    return new CacheResponseEntity<number>(result === 1, result);
  }

  deleteVerificationCodeWithTransaction(
    transaction: Transaction,
    key: string,
  ): Transaction {
    key = `${this.prefix}:${key}`;
    return transaction.del([key]);
  }
}
