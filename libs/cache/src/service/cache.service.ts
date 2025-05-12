import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  GlideClient,
  GlideReturnType,
  Transaction,
} from '@valkey/valkey-glide';
import { VALKEY_CONNECTION } from '../cache-connection-symbol';
import { CacheResponseEntity } from '../entity/cache.response.entity';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  protected cache: GlideClient;
  protected transaction: Transaction;

  constructor(@Inject(VALKEY_CONNECTION) _cache: GlideClient) {
    this.cache = _cache;
  }

  getTransaction(): Transaction {
    return new Transaction();
  }

  async executeTransaction(
    transaction: Transaction,
  ): Promise<CacheResponseEntity<GlideReturnType[]>> {
    const result = await this.cache.exec(transaction);
    this.logger.debug(`executeTransaction.result -> ${JSON.stringify(result)}`);
    let isExecuted: boolean = true;
    if (!result) return new CacheResponseEntity<GlideReturnType[]>(false);
    for (const command of result) {
      this.logger.debug(
        `executeTransaction.result.command -> ${JSON.stringify(command)}`,
      );
      if (command === null) {
        isExecuted = false;
        break;
      }
    }
    if (!isExecuted) return new CacheResponseEntity<GlideReturnType[]>(false);
    return new CacheResponseEntity<GlideReturnType[]>(true, result);
  }
}
