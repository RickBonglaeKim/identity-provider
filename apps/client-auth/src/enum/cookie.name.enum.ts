export const COOKIE_NAME = {
  IDP: 'iScreamArts-IDP',
  REDIRECT: 'iScreamArts-Redirect',
  PROVIDER: 'iScreamArts-Provider',
} as const;

export type CookieNames = (typeof COOKIE_NAME)[keyof typeof COOKIE_NAME];
