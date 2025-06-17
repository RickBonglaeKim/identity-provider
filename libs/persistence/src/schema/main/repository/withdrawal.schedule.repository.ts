import { Injectable, Logger } from '@nestjs/common';
import { MainSchemaService } from '../service/main.schema.service';
import { withdrawalSchedule } from 'libs/persistence/database-schema/main/schema';
import { ResponseEntity } from '@app/persistence/entity/response.entity';
import { and, eq, isNull } from 'drizzle-orm';
import { SelectMemberDetailByDistinctEmail } from '@app/persistence/entity/member.entity';

@Injectable()
export class WithdrawalScheduleRepository extends MainSchemaService {
  private readonly logger = new Logger(WithdrawalScheduleRepository.name);

  async insertWithdrawalSchedule(
    data: typeof withdrawalSchedule.$inferInsert,
  ): Promise<ResponseEntity<number> | undefined> {
    try {
      const result = (
        await this.mainTransaction.tx.insert(withdrawalSchedule).values(data)
      )[0];
      if (result.affectedRows === 0) {
        return new ResponseEntity<number>(false);
      }
      return new ResponseEntity<number>(true, result.affectedRows);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectWithdrawalScheduleByMemberId(
    memberId: number,
  ): Promise<
    ResponseEntity<typeof withdrawalSchedule.$inferSelect> | undefined
  > {
    try {
      const result = await this.mainTransaction.tx
        .select()
        .from(withdrawalSchedule)
        .where(eq(withdrawalSchedule.memberId, memberId));
      if (result.length > 1) {
        throw new Error(
          'The data searched by withdrawalSchedule.memberId is duplicated.',
        );
      }
      if (result.length === 0) {
        return new ResponseEntity<typeof withdrawalSchedule.$inferSelect>(
          false,
        );
      }
      return new ResponseEntity<typeof withdrawalSchedule.$inferSelect>(
        true,
        result[0],
      );
    } catch (error) {
      this.logger.error(error);
    }
  }
}
