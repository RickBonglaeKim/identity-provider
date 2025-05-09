import { and, desc, eq } from 'drizzle-orm';
import { Injectable, Logger } from '@nestjs/common';
import {
  client,
  clientUri,
} from 'libs/persistence/database-schema/main/schema';
import { MainSchemaService } from '../main.schema.service';
import { ResponseEntity } from '@app/persistence/entity/response.entity';
import { selectClientByClientIdAndClientSecret } from '@app/persistence/entity/main/main.client.entity';

@Injectable()
export class ClientRepository extends MainSchemaService {
  private readonly logger = new Logger(ClientRepository.name);

  async selectClientByClientIdAndClientSecret(
    clientId: string,
    clientSecret: string,
  ): Promise<
    ResponseEntity<selectClientByClientIdAndClientSecret> | undefined
  > {
    try {
      const result = await this.mainTransaction.tx
        .select({ clientKey: client.key, redirectUri: clientUri.redirectUri })
        .from(client)
        .innerJoin(clientUri, eq(client.key, clientUri.clientKey))
        .where(
          and(
            eq(client.clientId, clientId),
            eq(client.clientSecret, clientSecret),
          ),
        );
      if (result.length > 1) {
        throw new Error(
          'The data searched by client.clientId and client.clientSecret is duplicated.',
        );
      }
      if (result.length === 0) {
        return new ResponseEntity<selectClientByClientIdAndClientSecret>(false);
      }
      return new ResponseEntity<selectClientByClientIdAndClientSecret>(
        true,
        result[0],
      );
    } catch (error) {
      this.logger.error(error);
    }
  }
}
