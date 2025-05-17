export enum Providers {
  Kakao = 301,
  Naver = 302,
  Google = 401,
  Apple = 402,
}

type ProviderData = {
  provider: Providers;
  id: string;
  name: string;
  email: string;
  phone:
    | {
        countryCallingCode: string;
        phoneNumber: string;
      }
    | undefined;
};

export type Kakao = ProviderData & {
  provider: Providers.Kakao;
};

export type Naver = ProviderData & {
  provider: Providers.Naver;
};

export type Google = ProviderData & {
  provider: Providers.Google;
};

export type Apple = ProviderData & {
  provider: Providers.Apple;
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
