import { Inject, Injectable } from '@nestjs/common';
import { CacheService } from '@app/cache/service/cache.service';
import { Decoder, ExpireOptions, GlideClient } from '@valkey/valkey-glide';
import { CacheResponseEntity } from '../entity/cache.response.entity';
import { ConfigService } from '@nestjs/config';
import { VALKEY_CONNECTION } from '../cache-connection-symbol';

@Injectable()
export class AuthorizationAccessTokenCacheRepository extends CacheService {
  private readonly expirySeconds: number;
  private readonly prefix: string = 'accessToken';
  private readonly fields = {
    clientMemberId: 'clientMemberId',
    accessToken: 'accessToken',
    data: 'data',
  };

  constructor(
    @Inject(VALKEY_CONNECTION) _cache: GlideClient,
    private readonly configService: ConfigService,
  ) {
    super(_cache);
    this.expirySeconds =
      this.configService.getOrThrow<number>('TOKEN_EXPIRE_IN');
  }

  private createExpireOption(): { expireOption: ExpireOptions } {
    return {
      expireOption: ExpireOptions.HasNoExpiry,
    };
  }

  createKey(memberId: number, memberDetailId: number) {
    return `${this.prefix}:${memberId}:${memberDetailId}`;
  }

  async setAccessToken(
    key: string,
    clientMemberId: string,
    accessToken: string,
    data: string,
  ): Promise<CacheResponseEntity<number>> {
    const setResult = await this.cache.hset(key, [
      { field: this.fields.clientMemberId, value: clientMemberId },
      { field: this.fields.accessToken, value: accessToken },
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

  async getTokenInAccessToken(
    token: string,
  ): Promise<CacheResponseEntity<string>> {
    const key = `${this.prefix}:${token}`;
    const result = await this.cache.hget(key, this.fields.accessToken, {
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
}
