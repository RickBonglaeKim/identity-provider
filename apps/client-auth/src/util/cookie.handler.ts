// cookie.handler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Response, Request, CookieOptions } from 'express';
import * as cryptoJS from 'crypto-js';
import { SignCookie } from '../type/service/sign.service.type';
import { COOKIE_NAME, CookieNames } from '../enum/cookie.name.enum';

const cookieOptions: CookieOptions = {
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
};

@Injectable()
export class CookieHandler {
  private readonly logger = new Logger(CookieHandler.name);
  constructor(private readonly cookieEncryptionKey: string) {}

  setCookie(
    response: Response,
    cookieName: CookieNames,
    cookieValue: string,
    maxAgeInSeconds: number,
  ): void {
    const encryptedCookieValue = this.encryptCookie(cookieValue);
    response.cookie(cookieName, encryptedCookieValue, {
      ...cookieOptions,
      maxAge: maxAgeInSeconds * 1000,
    });
  }

  getSignInCookie(request: Request): SignCookie | undefined {
    const encryptedCookieValue = request.cookies[COOKIE_NAME.IDP] as string;
    if (!encryptedCookieValue) return undefined;
    return JSON.parse(this.decryptCookie(encryptedCookieValue)) as SignCookie;
  }

  getRedirectCookie(request: Request): string | undefined {
    const encryptedCookieValue = request.cookies[
      COOKIE_NAME.REDIRECT
    ] as string;
    if (!encryptedCookieValue) return undefined;
    return this.decryptCookie(encryptedCookieValue);
  }

  getProviderCookie(request: Request): number | undefined {
    this.logger.debug(
      `getProviderCookie.request.cookies -> ${JSON.stringify(request.cookies)}`,
    );
    const encryptedCookieValue = request.cookies[
      COOKIE_NAME.PROVIDER
    ] as string;
    if (!encryptedCookieValue) return undefined;
    return parseInt(this.decryptCookie(encryptedCookieValue), 10);
  }

  removeCookie(response: Response, cookieName: CookieNames): void {
    response.clearCookie(cookieName, cookieOptions);
  }

  private encryptCookie(value: string): string {
    return cryptoJS.AES.encrypt(value, this.cookieEncryptionKey).toString();
  }

  private decryptCookie(value: string): string {
    return cryptoJS.AES.decrypt(value, this.cookieEncryptionKey).toString(
      cryptoJS.enc.Utf8,
    );
  }
}
