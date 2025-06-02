import { PROVIDER } from 'dto/enum/provider.enum';

export type ProviderData = {
  id: string;
  name?: string;
  email?: string;
  phone:
    | {
        countryCallingCode: string;
        phoneNumber: string;
      }
    | undefined;
};

export type Kakao = ProviderData & {
  provider: typeof PROVIDER.KAKAO;
};

export type Naver = ProviderData & {
  provider: typeof PROVIDER.NAVER;
};

export type Google = ProviderData & {
  provider: typeof PROVIDER.GOOGLE;
};

export type Apple = ProviderData & {
  provider: typeof PROVIDER.APPLE;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  refresh_token_expires_in: number;
  connectUrl?: string;
};

export interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  refresh_token_expires_in: number;
}

export interface KakaoUserMeResponse {
  id: number;
  connected_at: string;
  kakao_account: {
    name_needs_agreement: boolean;
    name: string;
    has_email: boolean;
    email_needs_agreement: boolean;
    is_email_valid: boolean;
    is_email_verified: boolean;
    email: string;
    has_phone_number: boolean;
    phone_number_needs_agreement: boolean;
    phone_number: string;
  };
}
export interface NaverTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  refresh_token_expires_in: number;
}

export interface NaverUserMeResponse {
  resultcode: string;
  message: string;
  response: {
    id: string;
    email: string;
    mobile: string;
    mobile_e164: string;
    name: string;
  };
}

export interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  refresh_token_expires_in: number;
}

export interface GoogleUserMeResponse {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
}
