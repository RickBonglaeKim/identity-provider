import { Injectable, Logger } from '@nestjs/common';
import { MainSchemaService } from '../service/main.schema.service';
import { member } from 'libs/persistence/database-schema/main/schema';
import { and, eq } from 'drizzle-orm';
import { ResponseEntity } from '@app/persistence/entity/response.entity';

@Injectable()
export class MemberRepository extends MainSchemaService {
  private readonly logger = new Logger(MemberRepository.name);

  async insertMember(
    data: typeof member.$inferInsert,
  ): Promise<ResponseEntity<number> | undefined> {
    try {
      const result = (
        await this.mainTransaction.tx.insert(member).values(data)
      )[0];
      if (result.affectedRows === 0) {
        return new ResponseEntity<number>(false);
      }
      return new ResponseEntity<number>(true, result.insertId);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectMemberById(
    memberId: number,
  ): Promise<ResponseEntity<typeof member.$inferSelect> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select()
        .from(member)
        .where(eq(member.id, memberId));
      if (result.length > 1) {
        throw new Error('The data searched by member.id is duplicated.');
      }
      if (result.length === 0) {
        return new ResponseEntity<typeof member.$inferSelect>(false);
      }
      return new ResponseEntity<typeof member.$inferSelect>(true, result[0]);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
