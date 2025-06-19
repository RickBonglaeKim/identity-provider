import { Inject, Injectable } from '@nestjs/common';
import { CacheService } from '@app/cache/service/cache.service';
import { Decoder, ExpireOptions, GlideClient } from '@valkey/valkey-glide';
import { CacheResponseEntity } from '../entity/cache.response.entity';
import { ConfigService } from '@nestjs/config';
import { VALKEY_CONNECTION } from '../cache-connection-symbol';

@Injectable()
export class AuthorizationTokenCacheRepository extends CacheService {
  private readonly expirySeconds: number;
  private readonly prefix: string = 'token';
  private readonly fields = {
    clientMemberId: 'clientMemberId',
    idToken: 'idToken',
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
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

  createKey(memberId: number, memberDetailId: number) {
    return `${this.prefix}:${memberId}:${memberDetailId}`;
  }

  async setExpiry(key: string): Promise<boolean> {
    return await this.cache.expire(
      key,
      +this.expirySeconds,
      this.createExpireOption(),
    );
  }

  async setClientMemberId(
    key: string,
    clientMemberId: string,
  ): Promise<CacheResponseEntity<number>> {
    const setResult = await this.cache.hset(key, [
      { field: this.fields.clientMemberId, value: clientMemberId },
    ]);
    if (setResult >= 0) return new CacheResponseEntity<number>(true, setResult);
    return new CacheResponseEntity<number>(false);
  }

  async setIdToken(
    key: string,
    idToken: string,
  ): Promise<CacheResponseEntity<number>> {
    const setResult = await this.cache.hset(key, [
      { field: this.fields.idToken, value: idToken },
    ]);
    if (setResult >= 0) return new CacheResponseEntity<number>(true, setResult);
    return new CacheResponseEntity<number>(false);
  }

  async setAccessToken(
    key: string,
    accessToken: string,
  ): Promise<CacheResponseEntity<number>> {
    const setResult = await this.cache.hset(key, [
      { field: this.fields.accessToken, value: accessToken },
    ]);
    if (setResult >= 0) return new CacheResponseEntity<number>(true, setResult);
    return new CacheResponseEntity<number>(false);
  }

  async setRefreshToken(
    key: string,
    refreshToken: string,
  ): Promise<CacheResponseEntity<number>> {
    const setResult = await this.cache.hset(key, [
      { field: this.fields.refreshToken, value: refreshToken },
    ]);
    if (setResult >= 0) return new CacheResponseEntity<number>(true, setResult);
    return new CacheResponseEntity<number>(false);
  }

  async setData(
    key: string,
    data: string,
  ): Promise<CacheResponseEntity<number>> {
    const setResult = await this.cache.hset(key, [
      { field: this.fields.data, value: data },
    ]);
    if (setResult >= 0) return new CacheResponseEntity<number>(true, setResult);
    return new CacheResponseEntity<number>(false);
  }

  async getClientMemberId(key: string): Promise<CacheResponseEntity<string>> {
    const result = await this.cache.hget(key, this.fields.clientMemberId, {
      decoder: Decoder.String,
    });
    if (result) return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  async getIdToken(key: string): Promise<CacheResponseEntity<string>> {
    const result = await this.cache.hget(key, this.fields.idToken, {
      decoder: Decoder.String,
    });
    if (result) return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  async getAccessToken(key: string): Promise<CacheResponseEntity<string>> {
    const result = await this.cache.hget(key, this.fields.accessToken, {
      decoder: Decoder.String,
    });
    if (result) return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  async getRefreshToken(key: string): Promise<CacheResponseEntity<string>> {
    const result = await this.cache.hget(key, this.fields.refreshToken, {
      decoder: Decoder.String,
    });
    if (result) return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  async getData(key: string): Promise<CacheResponseEntity<string>> {
    const result = await this.cache.hget(key, this.fields.data, {
      decoder: Decoder.String,
    });
    if (result) return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  async delete(key: string): Promise<CacheResponseEntity<number>> {
    const result = await this.cache.del([key]);
    return new CacheResponseEntity<number>(result === 1, result);
  }
}
