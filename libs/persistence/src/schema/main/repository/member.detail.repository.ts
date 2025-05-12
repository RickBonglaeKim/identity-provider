import { Injectable, Logger } from '@nestjs/common';
import { MainSchemaService } from '../service/main.schema.service';
import {
  memberDetail,
  provider,
} from 'libs/persistence/database-schema/main/schema';
import { ResponseEntity } from '@app/persistence/entity/response.entity';
import { and, eq, isNull } from 'drizzle-orm';

@Injectable()
export class MemberDetailRepository extends MainSchemaService {
  private readonly logger = new Logger(MemberDetailRepository.name);

  async insertMemberDetail(
    data: typeof memberDetail.$inferInsert,
  ): Promise<ResponseEntity<number> | undefined> {
    try {
      const result = (
        await this.mainTransaction.tx.insert(memberDetail).values(data)
      )[0];
      if (result.affectedRows === 0) {
        return new ResponseEntity<number>(false);
      }
      return new ResponseEntity<number>(true, result.insertId);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectMemberDetailByEmailAndMemberDetailIdIsNull(
    email: string,
  ): Promise<ResponseEntity<typeof memberDetail.$inferSelect> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select()
        .from(memberDetail)
        .where(
          and(
            eq(memberDetail.email, email),
            isNull(memberDetail.memberDetailId),
          ),
        );
      if (result.length > 1) {
        throw new Error(
          'The data searched by member.email and memberDetail.id which is null is duplicated.',
        );
      }
      if (result.length === 0) {
        return new ResponseEntity<typeof memberDetail.$inferSelect>(false);
      }
      return new ResponseEntity<typeof memberDetail.$inferSelect>(
        true,
        result[0],
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectMemberDetailById(
    memberDetailId: number,
  ): Promise<ResponseEntity<typeof memberDetail.$inferSelect> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select()
        .from(memberDetail)
        .where(eq(memberDetail.id, memberDetailId));
      if (result.length > 1) {
        throw new Error('The data searched by memberDetail.id is duplicated.');
      }
      if (result.length === 0) {
        return new ResponseEntity<typeof memberDetail.$inferSelect>(false);
      }
      return new ResponseEntity<typeof memberDetail.$inferSelect>(
        true,
        result[0],
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectMemberDetailByEmailAndPassword(
    email: string,
    password: string,
  ): Promise<ResponseEntity<typeof memberDetail.$inferSelect> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select()
        .from(memberDetail)
        .where(
          and(
            eq(memberDetail.email, email),
            eq(memberDetail.password, password),
          ),
        );
      if (result.length > 1) {
        throw new Error(
          'The data searched by memberDetail.email and memberDetail.password is duplicated.',
        );
      }
      if (result.length === 0) {
        return new ResponseEntity<typeof memberDetail.$inferSelect>(false);
      }
      return new ResponseEntity<typeof memberDetail.$inferSelect>(
        true,
        result[0],
      );
    } catch (error) {
      this.logger.error(error);
    }
  }
}
