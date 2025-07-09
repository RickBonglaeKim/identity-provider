import { Injectable, Logger } from '@nestjs/common';
import { MainSchemaService } from '../service/main.schema.service';
import { memberWithdrawal } from 'libs/persistence/database-schema/main/schema';
import { ResponseEntity } from '@app/persistence/entity/response.entity';
import { eq } from 'drizzle-orm';

@Injectable()
export class MemberWithdrawalRepository extends MainSchemaService {
  private readonly logger = new Logger(MemberWithdrawalRepository.name);

  async insertWithdrawal(
    data: typeof memberWithdrawal.$inferInsert,
  ): Promise<ResponseEntity<number> | undefined> {
    try {
      const result = (
        await this.mainTransaction.tx.insert(memberWithdrawal).values(data)
      )[0];
      if (result.affectedRows === 0) {
        return new ResponseEntity<number>(false);
      }
      return new ResponseEntity<number>(true, result.affectedRows);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
