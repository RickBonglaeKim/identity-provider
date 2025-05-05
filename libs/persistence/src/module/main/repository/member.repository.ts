import { Injectable, Logger } from '@nestjs/common';
import { MainSchemaService } from '../main.schema.service';
import { member } from 'libs/persistence/database-schema/main/schema';
import { ResponseEntity } from '@app/persistence/response.entity';

@Injectable()
export class MemberRepository extends MainSchemaService {
  private readonly logger = new Logger(MemberRepository.name);

  async insertMember(
    data: typeof member.$inferInsert,
  ): Promise<ResponseEntity<number> | undefined> {
    try {
      const result = (await this.mainDB.insert(member).values(data))[0];
      if (result.affectedRows === 0) {
        return new ResponseEntity<number>(false);
      }
      return new ResponseEntity<number>(true, result.insertId);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
