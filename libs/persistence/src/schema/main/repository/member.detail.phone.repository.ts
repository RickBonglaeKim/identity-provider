import { Injectable, Logger } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { MainSchemaService } from '../service/main.schema.service';
import { memberDetailPhone } from 'libs/persistence/database-schema/main/schema';
import { ResponseEntity } from '@app/persistence/entity/response.entity';

@Injectable()
export class MemberDetailPhoneRepository extends MainSchemaService {
  private readonly logger = new Logger(MemberDetailPhoneRepository.name);

  async insertMemberDetailPhone(
    data: typeof memberDetailPhone.$inferInsert,
  ): Promise<ResponseEntity<number> | undefined> {
    try {
      const result = (
        await this.mainTransaction.tx.insert(memberDetailPhone).values(data)
      )[0];
      if (result.affectedRows === 0) {
        return new ResponseEntity<number>(false);
      }
      return new ResponseEntity<number>(true, result.affectedRows);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectMemberDetailByMemberDetailId(
    memberDetailId: number,
  ): Promise<
    ResponseEntity<typeof memberDetailPhone.$inferSelect> | undefined
  > {
    try {
      const result = await this.mainTransaction.tx
        .select()
        .from(memberDetailPhone)
        .where(eq(memberDetailPhone.memberDetailId, memberDetailId));
      if (result.length > 1) {
        throw new Error('The data searched by memberDetail.id is duplicated.');
      }
      if (result.length === 0) {
        return new ResponseEntity<typeof memberDetailPhone.$inferSelect>(false);
      }
      return new ResponseEntity<typeof memberDetailPhone.$inferSelect>(
        true,
        result[0],
      );
    } catch (error) {
      this.logger.error(error);
    }
  }
}
