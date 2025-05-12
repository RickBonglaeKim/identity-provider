import { Injectable } from '@nestjs/common';
import { CacheService } from '@app/cache/service/cache.service';
import {
  Decoder,
  GlideReturnType,
  GlideString,
  TimeUnit,
} from '@valkey/valkey-glide';

@Injectable()
export class CheckCacheRepository extends CacheService {
  async pingPong(): Promise<GlideReturnType> {
    const pong = await this.cache.customCommand(['PING']);
    return pong;
  }
}
