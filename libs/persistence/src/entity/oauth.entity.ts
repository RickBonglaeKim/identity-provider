import {
  client,
  clientUri,
} from 'libs/persistence/database-schema/main/schema';

type VerifyAuthorizationByClientIdAndClientSecretAndRedirectUriType = {
  clientUriId: typeof clientUri.$inferSelect.id;
  clientId: typeof client.$inferSelect.id;
  signCode: typeof client.$inferSelect.signCode;
};

export type VerifyAuthorizationByClientIdAndClientSecretAndRedirectUri =
  Required<VerifyAuthorizationByClientIdAndClientSecretAndRedirectUriType>;
