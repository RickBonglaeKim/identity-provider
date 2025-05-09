type selectClientByClientIdAndClientSecretType = {
  clientKey: string;
  redirectUri: string;
};
export type selectClientByClientIdAndClientSecret =
  Required<selectClientByClientIdAndClientSecretType>;
