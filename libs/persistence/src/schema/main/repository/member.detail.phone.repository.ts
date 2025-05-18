import { Injectable, Logger } from '@nestjs/common';
import { MainSchemaService } from '../service/main.schema.service';
import { memberDetailPhone } from 'libs/persistence/database-schema/main/schema';
import { ResponseEntity } from '@app/persistence/entity/response.entity';

@Injectable()
export class MemberDetailPhoneRepository extends MainSchemaService {
  private readonly logger = new Logger(MemberDetailPhoneRepository.name);

  async insertMemberDetail(
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
}
