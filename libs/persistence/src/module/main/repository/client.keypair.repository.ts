import { and, desc, eq } from 'drizzle-orm';
import { Injectable, Logger } from '@nestjs/common';
import { clientKeypair } from 'libs/persistence/database-schema/main/schema';
import { MainSchemaService } from '../main.schema.service';
import { ResponseEntity } from '@app/persistence/response.entity';

@Injectable()
export class ClientKeypairRepository extends MainSchemaService {
  private readonly logger = new Logger(ClientKeypairRepository.name);

  async insertClientKeypair(
    data: typeof clientKeypair.$inferInsert,
  ): Promise<ResponseEntity<number> | undefined> {
    try {
      const result = (
        await this.mainTransaction.tx.insert(clientKeypair).values(data)
      )[0];
      if (result.affectedRows === 0) {
        return new ResponseEntity<number>(false);
      }
      return new ResponseEntity<number>(true, result.insertId);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectOneClientKeypairById(
    id: number,
  ): Promise<ResponseEntity<typeof clientKeypair.$inferSelect> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select()
        .from(clientKeypair)
        .where(eq(clientKeypair.id, id));
      if (result.length > 1) {
        throw new Error('The data searched by id is duplicated.');
      }
      if (result.length === 0) {
        return new ResponseEntity<typeof clientKeypair.$inferSelect>(false);
      }
      return new ResponseEntity<typeof clientKeypair.$inferSelect>(
        true,
        result[0],
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectOneClientKeypairByClientKeyDescendingLatest(
    clientKey: string,
  ): Promise<ResponseEntity<typeof clientKeypair.$inferSelect> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select()
        .from(clientKeypair)
        .where(eq(clientKeypair.clientKey, clientKey))
        .limit(1);
      if (result.length === 0) {
        return new ResponseEntity<typeof clientKeypair.$inferSelect>(false);
      }
      return new ResponseEntity<typeof clientKeypair.$inferSelect>(
        true,
        result[0],
      );
    } catch (error) {
      this.logger.error(error);
    }
  }
}
