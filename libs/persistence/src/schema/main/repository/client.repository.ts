import { Injectable, Logger } from '@nestjs/common';
import { MainSchemaService } from '../service/main.schema.service';
import { client } from 'libs/persistence/database-schema/main/schema';
import { ResponseEntity } from '@app/persistence/entity/response.entity';
import { eq } from 'drizzle-orm';

@Injectable()
export class ClientRepository extends MainSchemaService {
  private readonly logger = new Logger(ClientRepository.name);

  async selectClientByClientId(
    client_clientId: string,
  ): Promise<ResponseEntity<typeof client.$inferSelect> | undefined> {
    try {
      const result = await this.mainTransaction.tx
        .select()
        .from(client)
        .where(eq(client.clientId, client_clientId));
      if (result.length > 1) {
        throw new Error('The data searched by client.client_id is duplicated.');
      }
      if (result.length === 0) {
        return new ResponseEntity<typeof client.$inferSelect>(false);
      }
      return new ResponseEntity<typeof client.$inferSelect>(true, result[0]);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
