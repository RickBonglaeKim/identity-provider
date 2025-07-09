import { Injectable, Logger } from '@nestjs/common';
import { MainSchemaService } from '../service/main.schema.service';
import {
  child,
  childArtBonbon,
} from 'libs/persistence/database-schema/main/schema';
import { ResponseEntity } from '@app/persistence/entity/response.entity';
import { and, eq } from 'drizzle-orm';
import { SelectChildWithChildArtBonBon } from '@app/persistence/entity/child.entity';

@Injectable()
export class ChildRepository extends MainSchemaService {
  private readonly logger = new Logger(ChildRepository.name);

  async insertChild(
    data: typeof child.$inferInsert,
  ): Promise<ResponseEntity<number> | undefined> {
    try {
      const result = (
        await this.mainTransaction.tx.insert(child).values(data)
      )[0];
      if (result.affectedRows === 0) {
        return new ResponseEntity<number>(false);
      }
      return new ResponseEntity<number>(true, result.insertId);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async updateChildById(
    id: number,
    data: typeof child.$inferInsert,
  ): Promise<ResponseEntity<number> | undefined> {
    try {
      const result = (
        await this.mainTransaction.tx
          .update(child)
          .set(data)
          .where(eq(child.id, id))
      )[0];
      if (result.affectedRows === 0) {
        return new ResponseEntity<number>(false);
      }
      return new ResponseEntity<number>(true, result.affectedRows);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async updateChildByMemberIdAndId(
    id: number,
    data: typeof child.$inferInsert,
  ): Promise<ResponseEntity<number> | undefined> {
    try {
      const result = (
        await this.mainTransaction.tx
          .update(child)
          .set(data)
          .where(and(eq(child.memberId, data.memberId), eq(child.id, id)))
      )[0];
      if (result.affectedRows === 0) {
        return new ResponseEntity<number>(false);
      }
      return new ResponseEntity<number>(true, result.affectedRows);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async deleteChildById(
    id: number,
  ): Promise<ResponseEntity<number> | undefined> {
    try {
      const result = (
        await this.mainTransaction.tx.delete(child).where(eq(child.id, id))
      )[0];
      if (result.affectedRows === 0) {
        return new ResponseEntity<number>(false);
      }
      return new ResponseEntity<number>(true, result.affectedRows);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async deleteChildByMemberId(
    memberId: number,
  ): Promise<ResponseEntity<number> | undefined> {
    try {
      const result = (
        await this.mainTransaction.tx
          .delete(child)
          .where(eq(child.memberId, memberId))
      )[0];
      if (result.affectedRows === 0) {
        return new ResponseEntity<number>(false);
      }
      return new ResponseEntity<number>(true, result.affectedRows);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async deleteChildByMemberIdAndId(
    memberId: number,
    id: number,
  ): Promise<ResponseEntity<number> | undefined> {
    try {
      const result = (
        await this.mainTransaction.tx
          .delete(child)
          .where(and(eq(child.memberId, memberId), eq(child.id, id)))
      )[0];
      if (result.affectedRows === 0) {
        return new ResponseEntity<number>(false);
      }
      return new ResponseEntity<number>(true, result.affectedRows);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectChildByMemberIdAndId(
    memberId: number,
    id: number,
  ): Promise<ResponseEntity<typeof child.$inferSelect> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select()
        .from(child)
        .where(and(eq(child.memberId, memberId), eq(child.id, id)));
      if (result.length > 1) {
        throw new Error('The data searched by child.id is duplicated.');
      }
      if (result.length === 0) {
        return new ResponseEntity<typeof child.$inferSelect>(false);
      }
      return new ResponseEntity<typeof child.$inferSelect>(true, result[0]);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectChildByMemberIdAndIdWithChildArtBonBon(
    memberId: number,
    id: number,
  ): Promise<ResponseEntity<SelectChildWithChildArtBonBon> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select({ child, childArtBonbon })
        .from(child)
        .leftJoin(childArtBonbon, eq(child.id, childArtBonbon.childId))
        .where(and(eq(child.memberId, memberId), eq(child.id, id)));
      if (result.length > 1) {
        throw new Error('The data searched by child.id is duplicated.');
      }
      if (result.length === 0) {
        return new ResponseEntity<SelectChildWithChildArtBonBon>(false);
      }
      return new ResponseEntity<SelectChildWithChildArtBonBon>(true, result[0]);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectChildByMemberIdWithChildArtBonBon(
    memberId: number,
  ): Promise<ResponseEntity<SelectChildWithChildArtBonBon[]> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select({ child, childArtBonbon })
        .from(child)
        .leftJoin(childArtBonbon, eq(child.id, childArtBonbon.childId))
        .where(eq(child.memberId, memberId));
      if (result.length === 0) {
        return new ResponseEntity<SelectChildWithChildArtBonBon[]>(false);
      }
      return new ResponseEntity<SelectChildWithChildArtBonBon[]>(true, result);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectChildByMemberIdWithChildArtBonBonOnInnerJoin(
    memberId: number,
  ): Promise<ResponseEntity<SelectChildWithChildArtBonBon[]> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select({ child, childArtBonbon })
        .from(child)
        .innerJoin(childArtBonbon, eq(child.id, childArtBonbon.childId))
        .where(eq(child.memberId, memberId));
      if (result.length === 0) {
        return new ResponseEntity<SelectChildWithChildArtBonBon[]>(false);
      }
      return new ResponseEntity<SelectChildWithChildArtBonBon[]>(true, result);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectChildByMemberId(
    memberId: number,
  ): Promise<ResponseEntity<SelectChildWithChildArtBonBon[]> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select({ child, childArtBonbon })
        .from(child)
        .leftJoin(childArtBonbon, eq(child.id, childArtBonbon.childId))
        .where(eq(child.memberId, memberId));
      if (result.length === 0) {
        return new ResponseEntity<SelectChildWithChildArtBonBon[]>(false);
      }
      return new ResponseEntity<SelectChildWithChildArtBonBon[]>(true, result);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
