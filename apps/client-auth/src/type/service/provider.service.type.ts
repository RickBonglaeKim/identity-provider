enum Providers {
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
  countryCallingCode: string;
  phoneNumber: string;
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
  provider: Providers.Google;
};
