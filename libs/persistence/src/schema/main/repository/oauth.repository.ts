import { and, desc, eq, getTableColumns } from 'drizzle-orm';
import { Injectable, Logger } from '@nestjs/common';
import {
  client,
  clientUri,
} from 'libs/persistence/database-schema/main/schema';
import { MainSchemaService } from '../main.schema.service';
import { ResponseEntity } from '@app/persistence/entity/response.entity';
import { verifyAuthorizationByClientIdAndClientSecretAndRedirectUri } from '@app/persistence/entity/oauth.entity';

@Injectable()
export class OauthRepository extends MainSchemaService {
  private readonly logger = new Logger(OauthRepository.name);

  async verifyAuthorizationByClientIdAndClientSecretAndRedirectUri(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ): Promise<
    | ResponseEntity<verifyAuthorizationByClientIdAndClientSecretAndRedirectUri>
    | undefined
  > {
    try {
      const result = await this.mainTransaction.tx
        .select({ clientUriId: clientUri.id, clientId: client.id })
        .from(client)
        .innerJoin(clientUri, eq(clientUri.clientId, client.id))
        .where(
          and(
            eq(client.clientId, clientId),
            eq(client.clientSecret, clientSecret),
            eq(clientUri.redirectUri, redirectUri),
          ),
        );
      if (result.length > 1) {
        throw new Error(
          'The data searched by client.clientId and client.clientSecret is duplicated.',
        );
      }
      if (result.length === 0) {
        return new ResponseEntity<verifyAuthorizationByClientIdAndClientSecretAndRedirectUri>(
          false,
        );
      }
      return new ResponseEntity<verifyAuthorizationByClientIdAndClientSecretAndRedirectUri>(
        true,
        result[0],
      );
    } catch (error) {
      this.logger.error(error);
    }
  }
}
