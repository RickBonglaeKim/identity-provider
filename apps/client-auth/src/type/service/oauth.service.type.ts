export type OauthError =
  | 'invalid_request'
  | 'unauthorized_client'
  | 'access_denied'
  | 'unsupported_response_type'
  | 'invalid_scope'
  | 'server_error'
  | 'temporarily_unavailable';

export type OauthInternalError =
  | 'invalid_code'
  | 'invalid_state'
  | 'invalid_kakao'
  | 'invalid_naver'
  | 'invalid_google'
  | 'invalid_apple'
  | 'invalid_member'
  | 'invalid_passport'
  | 'phone_duplication'
  | 'email_duplication';

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

export type SignVerification = {
  isVerified: boolean;
  signCode: string | undefined;
};

export const IdTokenPayloadKey = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  child: 'child',
};

type IdTokenPayloadPhone = {
  countryCallingCode: string;
  number: string;
}[];

type IdTokenPayloadChild = {
  id: number;
  createAt: string;
  name: string | null;
  birthday: string | null;
  gender: string | null;
}[];

export type IdTokenPayload = {
  name?: string;
  email?: string;
  phone?: IdTokenPayloadPhone;
  child?: IdTokenPayloadChild;
};
