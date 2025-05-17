import { Inject, Injectable } from '@nestjs/common';
import { CacheService } from '@app/cache/service/cache.service';
import {
  Decoder,
  ExpireOptions,
  GlideClient,
  Transaction,
} from '@valkey/valkey-glide';
import { CacheResponseEntity } from '../entity/cache.response.entity';
import { ConfigService } from '@nestjs/config';
import { VALKEY_CONNECTION } from '../cache-connection-symbol';

@Injectable()
export class AuthorizationRefreshTokenCacheRepository extends CacheService {
  private readonly expirySeconds: number;
  private readonly prefix: string = 'refreshToken';
  private readonly fields = {
    memberId: 'memberId',
    memberDetailId: 'memberDetailId',
    clientMemberId: 'clientMemberId',
    data: 'data',
  };

  constructor(
    @Inject(VALKEY_CONNECTION) _cache: GlideClient,
    private readonly configService: ConfigService,
  ) {
    super(_cache);
    this.expirySeconds = this.configService.getOrThrow<number>(
      'REFRESH_TOKEN_EXPIRE_IN',
    );
  }

  private createExpireOption(): { expireOption: ExpireOptions } {
    return {
      expireOption: ExpireOptions.HasNoExpiry,
    };
  }

  async setRefreshToken(
    token: string,
    memberId: string,
    memberDetailId: string,
    clientMemberId: string,
    data: string,
  ): Promise<CacheResponseEntity<number>> {
    const key = `${this.prefix}:${token}`;
    const setResult = await this.cache.hset(key, [
      { field: this.fields.memberId, value: memberId },
      { field: this.fields.memberDetailId, value: memberDetailId },
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

  setRefreshTokenWithTransaction(
    transaction: Transaction,
    token: string,
    memberId: string,
    memberDetailId: string,
    clientMemberId: string,
    data: string,
  ): Transaction {
    const key = `${this.prefix}:${token}`;
    return transaction
      .hset(key, [
        { field: this.fields.memberId, value: memberId },
        { field: this.fields.memberDetailId, value: memberDetailId },
        { field: this.fields.clientMemberId, value: clientMemberId },
        { field: this.fields.data, value: data },
      ])
      .expire(key, this.expirySeconds, this.createExpireOption());
  }

  async getMemberIdInRefreshToken(
    token: string,
  ): Promise<CacheResponseEntity<string>> {
    const key = `${this.prefix}:${token}`;
    const result = await this.cache.hget(key, this.fields.memberId, {
      decoder: Decoder.String,
    });
    if (result) return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  async getClientMemberDetailIdIdInRefreshToken(
    token: string,
  ): Promise<CacheResponseEntity<string>> {
    const key = `${this.prefix}:${token}`;
    const result = await this.cache.hget(key, this.fields.memberDetailId, {
      decoder: Decoder.String,
    });
    if (result) return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  async getClientMemberIdInRefreshToken(
    token: string,
  ): Promise<CacheResponseEntity<string>> {
    const key = `${this.prefix}:${token}`;
    const result = await this.cache.hget(key, this.fields.clientMemberId, {
      decoder: Decoder.String,
    });
    if (result) return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  async getDataInRefreshToken(
    token: string,
  ): Promise<CacheResponseEntity<string>> {
    const key = `${this.prefix}:${token}`;
    const result = await this.cache.hget(key, this.fields.data, {
      decoder: Decoder.String,
    });
    if (result) return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  async deleteRefreshToken(
    token: string,
  ): Promise<CacheResponseEntity<number>> {
    const key = `${this.prefix}:${token}`;
    const result = await this.cache.del([key]);
    return new CacheResponseEntity<number>(result === 1, result);
  }

  deleteRefreshTokenWithTransaction(
    transaction: Transaction,
    token: string,
  ): Transaction {
    const key = `${this.prefix}:${token}`;
    return transaction.del([key]);
  }
}
