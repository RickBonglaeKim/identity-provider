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
export class AuthorizationAccessTokenCacheRepository extends CacheService {
  private readonly expirySeconds: number = 60 * 60 * 12; // 12 hours
  private readonly prefix: string = 'accessToken';
  private readonly fields = {
    memberId: 'memberId',
    clientMemberId: 'clientMemberId',
    data: 'data',
  };

  private createExpireOption(): { expireOption: ExpireOptions } {
    return {
      expireOption: ExpireOptions.HasNoExpiry,
    };
  }

  async setAccessToken(
    token: string,
    memberId: string,
    clientMemberId: string,
    data: string,
  ): Promise<CacheResponseEntity<number>> {
    const key = `${this.prefix}:${token}`;
    const setResult = await this.cache.hset(key, [
      { field: this.fields.memberId, value: memberId },
      { field: this.fields.clientMemberId, value: clientMemberId },
      { field: this.fields.data, value: data },
    ]);
    const expireResult = await this.cache.expire(
      key,
      this.expirySeconds,
      this.createExpireOption(),
    );
    if (setResult > 0 && expireResult)
      return new CacheResponseEntity<number>(true, setResult);
    return new CacheResponseEntity<number>(false);
  }

  setAccessTokenWithTransaction(
    transaction: Transaction,
    token: string,
    memberId: string,
    clientMemberId: string,
    data: string,
  ): Transaction {
    const key = `${this.prefix}:${token}`;
    return transaction
      .hset(key, [
        { field: this.fields.memberId, value: memberId },
        { field: this.fields.clientMemberId, value: clientMemberId },
        { field: this.fields.data, value: data },
      ])
      .expire(key, this.expirySeconds, this.createExpireOption());
  }

  async getMemberIdInAccessToken(
    token: string,
  ): Promise<CacheResponseEntity<string>> {
    const key = `${this.prefix}:${token}`;
    const result = await this.cache.hget(key, this.fields.memberId, {
      decoder: Decoder.String,
    });
    if (result) return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  async getClientMemberIdInAccessToken(
    token: string,
  ): Promise<CacheResponseEntity<string>> {
    const key = `${this.prefix}:${token}`;
    const result = await this.cache.hget(key, this.fields.clientMemberId, {
      decoder: Decoder.String,
    });
    if (result) return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  async getDataInAccessToken(
    token: string,
  ): Promise<CacheResponseEntity<string>> {
    const key = `${this.prefix}:${token}`;
    const result = await this.cache.hget(key, this.fields.data, {
      decoder: Decoder.String,
    });
    if (result) return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  async deleteAccessToken(token: string): Promise<CacheResponseEntity<number>> {
    const key = `${this.prefix}:${token}`;
    const result = await this.cache.del([key]);
    return new CacheResponseEntity<number>(result === 1, result);
  }

  deleteAccessTokenWithTransaction(
    transaction: Transaction,
    token: string,
  ): Transaction {
    const key = `${this.prefix}:${token}`;
    return transaction.del([key]);
  }
}