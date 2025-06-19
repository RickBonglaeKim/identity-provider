import { Injectable, Logger } from '@nestjs/common';
import { MainSchemaService } from '../service/main.schema.service';
import {
  child,
  childArtBonbon,
} from 'libs/persistence/database-schema/main/schema';
import { ResponseEntity } from '@app/persistence/entity/response.entity';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class ChildArtBonBonRepository extends MainSchemaService {
  private readonly logger = new Logger(ChildArtBonBonRepository.name);

  async insertChildArtBonBon(
    data: typeof childArtBonbon.$inferInsert,
  ): Promise<ResponseEntity<number> | undefined> {
    try {
      const result = (
        await this.mainTransaction.tx.insert(childArtBonbon).values(data)
      )[0];
      if (result.affectedRows === 0) {
        return new ResponseEntity<number>(false);
      }
      return new ResponseEntity<number>(true, result.affectedRows);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async updateChildArtBonBonById(
    childId: number,
    data: typeof childArtBonbon.$inferInsert,
  ): Promise<ResponseEntity<number> | undefined> {
    try {
      const result = (
        await this.mainTransaction.tx
          .update(childArtBonbon)
          .set(data)
          .where(eq(childArtBonbon.childId, childId))
      )[0];
      if (result.affectedRows === 0) {
        return new ResponseEntity<number>(false);
      }
      return new ResponseEntity<number>(true, result.affectedRows);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async deleteChildArtBonBonById(
    childId: number,
  ): Promise<ResponseEntity<number> | undefined> {
    try {
      const result = (
        await this.mainTransaction.tx
          .delete(childArtBonbon)
          .where(eq(childArtBonbon.childId, childId))
      )[0];
      if (result.affectedRows === 0) {
        return new ResponseEntity<number>(false);
      }
      return new ResponseEntity<number>(true, result.affectedRows);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectChildArtBonBonByChildId(
    childId: number,
  ): Promise<ResponseEntity<typeof childArtBonbon.$inferSelect> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select()
        .from(childArtBonbon)
        .where(eq(childArtBonbon.childId, childId));
      if (result.length > 1) {
        throw new Error(
          'The data searched by child__art_bonbon.child_id is duplicated.',
        );
      }
      if (result.length === 0) {
        return new ResponseEntity<typeof childArtBonbon.$inferSelect>(false);
      }
      return new ResponseEntity<typeof childArtBonbon.$inferSelect>(
        true,
        result[0],
      );
    } catch (error) {
      this.logger.error(error);
    }
  }
}
