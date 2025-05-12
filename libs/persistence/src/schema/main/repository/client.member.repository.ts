import { Injectable, Logger } from '@nestjs/common';
import { MainSchemaService } from '../service/main.schema.service';
import { clientMember } from 'libs/persistence/database-schema/main/schema';
import { ResponseEntity } from '@app/persistence/entity/response.entity';
import { eq } from 'drizzle-orm';

@Injectable()
export class ClientMemberRepository extends MainSchemaService {
  private readonly logger = new Logger(ClientMemberRepository.name);

  async insertMemberClient(
    data: typeof clientMember.$inferInsert,
  ): Promise<ResponseEntity<number> | undefined> {
    try {
      const result = (
        await this.mainTransaction.tx.insert(clientMember).values(data)
      )[0];
      if (result.affectedRows === 0) {
        return new ResponseEntity<number>(false);
      }
      return new ResponseEntity<number>(true, result.insertId);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectMemberDetailById(
    clientMemberId: number,
  ): Promise<ResponseEntity<typeof clientMember.$inferSelect> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select()
        .from(clientMember)
        .where(eq(clientMember.id, clientMemberId));
      if (result.length > 1) {
        throw new Error('The data searched by clientMember.id is duplicated.');
      }
      if (result.length === 0) {
        return new ResponseEntity<typeof clientMember.$inferSelect>(false);
      }
      return new ResponseEntity<typeof clientMember.$inferSelect>(
        true,
        result[0],
      );
    } catch (error) {
      this.logger.error(error);
    }
  }
}
