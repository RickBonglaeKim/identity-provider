// cookie.handler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Response, Request, CookieOptions } from 'express';
import * as cryptoJS from 'crypto-js';
import { SignCookie } from '../type/service/sign.service.type';
import { CookieNames } from '../enum/cookie.name.enum';

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

  getCookie(request: Request, cookieName: CookieNames): SignCookie | undefined {
    const encryptedCookieValue = request.cookies[cookieName] as string;
    if (!encryptedCookieValue) return undefined;
    return this.parseCookieValue(this.decryptCookie(encryptedCookieValue));
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

  private parseCookieValue(value: string): SignCookie {
    return JSON.parse(value) as SignCookie;
  }
}
