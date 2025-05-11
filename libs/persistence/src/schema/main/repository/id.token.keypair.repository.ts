import { and, desc, eq, sql } from 'drizzle-orm';
import { Injectable, Logger } from '@nestjs/common';
import { idTokenKeypair } from 'libs/persistence/database-schema/main/schema';
import { MainSchemaService } from '../main.schema.service';
import { ResponseEntity } from '@app/persistence/entity/response.entity';

@Injectable()
export class IdTokenKeypairRepository extends MainSchemaService {
  private readonly logger = new Logger(IdTokenKeypairRepository.name);

  async insertIdTokenKeypair(
    data: typeof idTokenKeypair.$inferInsert,
  ): Promise<ResponseEntity<number> | undefined> {
    try {
      const result = (
        await this.mainTransaction.tx.insert(idTokenKeypair).values(data)
      )[0];
      if (result.affectedRows === 0) {
        return new ResponseEntity<number>(false);
      }
      return new ResponseEntity<number>(true, result.insertId);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectOneIdTokenKeypairById(
    id: number,
  ): Promise<ResponseEntity<typeof idTokenKeypair.$inferSelect> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select()
        .from(idTokenKeypair)
        .where(eq(idTokenKeypair.id, id));
      if (result.length > 1) {
        throw new Error('The data searched by id is duplicated.');
      }
      if (result.length === 0) {
        return new ResponseEntity<typeof idTokenKeypair.$inferSelect>(false);
      }
      return new ResponseEntity<typeof idTokenKeypair.$inferSelect>(
        true,
        result[0],
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectMultipleIdTokenKeypairByIsActivatedDescendingLatest(
    limit: number,
  ): Promise<
    ResponseEntity<(typeof idTokenKeypair.$inferSelect)[]> | undefined
  > {
    try {
      const result = await this.mainTransaction.tx
        .select()
        .from(idTokenKeypair)
        .where(eq(idTokenKeypair.isActivated, 1))
        .orderBy(desc(idTokenKeypair.id))
        .limit(limit);
      if (result.length === 0) {
        return new ResponseEntity<(typeof idTokenKeypair.$inferSelect)[]>(
          false,
        );
      }
      return new ResponseEntity<(typeof idTokenKeypair.$inferSelect)[]>(
        true,
        result,
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectOneIdTokenKeypairByIsActivatedOrderByRandom(): Promise<
    ResponseEntity<(typeof idTokenKeypair.$inferSelect)[]> | undefined
  > {
    try {
      const result = await this.mainTransaction.tx
        .select()
        .from(idTokenKeypair)
        .where(eq(idTokenKeypair.isActivated, 1))
        .orderBy(sql`rand()`)
        .limit(1);
      if (result.length === 0) {
        return new ResponseEntity<(typeof idTokenKeypair.$inferSelect)[]>(
          false,
        );
      }
      return new ResponseEntity<(typeof idTokenKeypair.$inferSelect)[]>(
        true,
        result,
      );
    } catch (error) {
      this.logger.error(error);
    }
  }
}
