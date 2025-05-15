export type OauthError =
  | 'invalid_request'
  | 'unauthorized_client'
  | 'access_denied'
  | 'unsupported_response_type'
  | 'invalid_scope'
  | 'server_error'
  | 'temporarily_unavailable';

export type OauthErrorDescription = string | null;

export type OauthErrorUri = string | null;

export type OauthState = string | null;

export type CreateRedirectUriReturn = (
  state: OauthState,
) => (
  error: OauthError,
) => (
  errorDescription: OauthErrorDescription,
) => (errorUri: OauthErrorUri) => string;

export type Keypair = {
  privateKey: string;
  publicKey: string;
};

export const IdTokenPayloadKey = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  child: 'child',
};

export type IdTokenPayload = {
  name: string;
  email: string;
  phone: {
    countryCallingCode: string;
    number: string;
  }[];
  child: {
    id: number;
    name: string;
    birthday: string;
    createAt: string;
    gender: 'GENDER.MALE' | 'GENDER.FEMALE';
  }[];
};
