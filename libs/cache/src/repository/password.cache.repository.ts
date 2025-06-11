import { Injectable } from '@nestjs/common';
import { CacheService } from '@app/cache/service/cache.service';
import { Decoder, SetOptions, TimeUnit } from '@valkey/valkey-glide';
import { CacheResponseEntity } from '../entity/cache.response.entity';

@Injectable()
export class PasswordCacheRepository extends CacheService {
  private readonly prefix = 'password';
  private createSetOption(): SetOptions {
    return {
      expiry: { type: TimeUnit.Milliseconds, count: 1000 * 60 * 30 },
      conditionalSet: 'onlyIfDoesNotExist',
      returnOldValue: false,
    };
  }

  private createKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async setPasswordToken(
    key: string,
    data: string,
  ): Promise<CacheResponseEntity<string>> {
    const result = await this.cache.set(
      this.createKey(key),
      data,
      this.createSetOption(),
    );
    if (result === 'OK')
      return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  async getPasswordToken(key: string): Promise<CacheResponseEntity<string>> {
    const result = await this.cache.get(this.createKey(key), {
      decoder: Decoder.String,
    });
    if (result) return new CacheResponseEntity<string>(true, result.toString());
    return new CacheResponseEntity<string>(false);
  }

  async deletePasswordToken(key: string): Promise<CacheResponseEntity<number>> {
    const result: number = await this.cache.del([this.createKey(key)]);
    return new CacheResponseEntity<number>(result === 1, result);
  }
}
