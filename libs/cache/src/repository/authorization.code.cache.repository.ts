import { Injectable } from '@nestjs/common';
import { CacheService } from '@app/cache/service/cache.service';
import {
  Decoder,
  ExpireOptions,
  SetOptions,
  TimeUnit,
  Transaction,
} from '@valkey/valkey-glide';
import { CacheResponseEntity } from '../entity/cache.response.entity';

@Injectable()
export class AuthorizationCodeCacheRepository extends CacheService {
  private readonly expirySeconds = 60 * 10;
  private readonly fields = { memberId: 'memberId', data: 'data' };

  private createExpireOption(): { expireOption: ExpireOptions } {
    return {
      expireOption: ExpireOptions.HasNoExpiry,
    };
  }

  async setAuthorizationCode(
    memberId: string,
    code: string,
    data: string,
  ): Promise<CacheResponseEntity<number>> {
    const setResult = await this.cache.hset(code, [
      { field: this.fields.memberId, value: memberId },
      { field: this.fields.data, value: data },
    ]);
    const expireResult = await this.cache.expire(
      code,
      this.expirySeconds,
      this.createExpireOption(),
    );
    if (setResult > 0 && expireResult)
      return new CacheResponseEntity<number>(true, setResult);
    return new CacheResponseEntity<number>(false);
  }

  setAuthorizationCodeWithTransaction(
    transaction: Transaction,
    memberId: string,
    code: string,
    data: string,
  ): Transaction {
    return transaction
      .hset(code, [
        { field: this.fields.memberId, value: memberId },
        { field: this.fields.data, value: data },
      ])
      .expire(code, this.expirySeconds, this.createExpireOption());
  }

  async getMemberIdInAuthorizationCode(
    code: string,
  ): Promise<CacheResponseEntity<string>> {
    const result = await this.cache.hget(code, this.fields.memberId, {
      decoder: Decoder.String,
    });
    if (result) return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  async getDataInAuthorizationCode(
    code: string,
  ): Promise<CacheResponseEntity<string>> {
    const result = await this.cache.hget(code, this.fields.data, {
      decoder: Decoder.String,
    });
    if (result) return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  getMemberIdInAuthorizationCodeWithTransaction(
    transaction: Transaction,
    code: string,
  ): Transaction {
    return transaction.hget(code, this.fields.memberId);
  }

  getDataInAuthorizationCodeWithTransaction(
    transaction: Transaction,
    code: string,
  ): Transaction {
    return transaction.hget(code, this.fields.data);
  }

  async deleteAuthorizationCode(
    code: string,
  ): Promise<CacheResponseEntity<number>> {
    const result = await this.cache.hdel(code, [
      this.fields.memberId,
      this.fields.data,
    ]);
    return new CacheResponseEntity<number>(result === 1, result);
  }

  deleteAuthorizationCodeWithTransaction(
    transaction: Transaction,
    code: string,
  ): Transaction {
    return transaction.hdel(code, [this.fields.memberId, this.fields.data]);
  }
}
