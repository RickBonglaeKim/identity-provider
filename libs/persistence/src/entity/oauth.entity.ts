import {
  client,
  clientUri,
} from 'libs/persistence/database-schema/main/schema';

type verifyAuthorizationByClientIdAndClientSecretAndRedirectUriType = {
  clientUriId: typeof clientUri.$inferSelect.id;
  clientId: typeof client.$inferSelect.id;
};
export type verifyAuthorizationByClientIdAndClientSecretAndRedirectUri =
  Required<verifyAuthorizationByClientIdAndClientSecretAndRedirectUriType>;
