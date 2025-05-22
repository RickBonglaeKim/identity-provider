import { Injectable } from '@nestjs/common';
import { CacheService } from '@app/cache/service/cache.service';
import { Decoder, SetOptions, TimeUnit } from '@valkey/valkey-glide';
import { CacheResponseEntity } from '../entity/cache.response.entity';

@Injectable()
export class PassportCacheRepository extends CacheService {
  private readonly prefix = 'passport';
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
    key = `${this.prefix}:${key}`;
    const result = await this.cache.set(key, data, this.createSetOption());
    if (result === 'OK')
      return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  async getPassport(key: string): Promise<CacheResponseEntity<string>> {
    key = `${this.prefix}:${key}`;
    const result = await this.cache.get(key, { decoder: Decoder.String });
    if (result) return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  async deletePassport(key: string): Promise<CacheResponseEntity<number>> {
    key = `${this.prefix}:${key}`;
    const result: number = await this.cache.del([key]);
    return new CacheResponseEntity<number>(result === 1, result);
  }
}
