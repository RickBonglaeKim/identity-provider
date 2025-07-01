import { Injectable } from '@nestjs/common';
import { CacheService } from '@app/cache/service/cache.service';
import { Decoder, ExpireOptions, Transaction } from '@valkey/valkey-glide';
import { CacheResponseEntity } from '../entity/cache.response.entity';

@Injectable()
export class AuthorizationCodeCacheRepository extends CacheService {
  private readonly expirySeconds = 60 * 10;
  private readonly prefix = 'authorizationCode';
  private readonly fields = {
    memberId: 'memberId',
    memberDetailId: 'memberDetailId',
    clientMemberId: 'clientMemberId',
    data: 'data',
  };

  private createExpireOption(): { expireOption: ExpireOptions } {
    return {
      expireOption: ExpireOptions.HasNoExpiry,
    };
  }

  createKey(code: string): string {
    return `${this.prefix}:${code}`;
  }

  async setAuthorizationCode(
    key: string,
    memberId: string,
    memberDetailId: string,
    clientMemberId: string,
    data: string,
  ): Promise<CacheResponseEntity<number>> {
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

  async getMemberId(code: string): Promise<CacheResponseEntity<string>> {
    const key = `${this.prefix}:${code}`;
    const result = await this.cache.hget(key, this.fields.memberId, {
      decoder: Decoder.String,
    });
    if (result) return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  async getMemberDetailId(code: string): Promise<CacheResponseEntity<string>> {
    const key = `${this.prefix}:${code}`;
    const result = await this.cache.hget(key, this.fields.memberDetailId, {
      decoder: Decoder.String,
    });
    if (result) return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  async getClientMemberId(code: string): Promise<CacheResponseEntity<string>> {
    const key = `${this.prefix}:${code}`;
    const result = await this.cache.hget(key, this.fields.clientMemberId, {
      decoder: Decoder.String,
    });
    if (result) return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  async getData(code: string): Promise<CacheResponseEntity<string>> {
    const key = `${this.prefix}:${code}`;
    const result = await this.cache.hget(key, this.fields.data, {
      decoder: Decoder.String,
    });
    if (result) return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  async deleteAuthorizationCode(
    code: string,
  ): Promise<CacheResponseEntity<number>> {
    const key = `${this.prefix}:${code}`;
    const result = await this.cache.del([key]);
    return new CacheResponseEntity<number>(result === 1, result);
  }
}
