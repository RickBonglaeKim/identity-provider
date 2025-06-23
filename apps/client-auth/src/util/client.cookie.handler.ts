// cookie.handler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Response, Request, CookieOptions } from 'express';
import { ClientCookieNames } from 'dto/enum/client.cookie.name.enum';

const cookieOptions: CookieOptions = {
  path: '/',
  httpOnly: false,
  secure: true,
  sameSite: 'none',
};

@Injectable()
export class ClientCookieHandler {
  private readonly logger = new Logger(ClientCookieHandler.name);

  private signUrl: string;

  constructor(signUrl: string) {
    this.signUrl = signUrl;
  }

  setCookie(
    response: Response,
    cookieName: ClientCookieNames,
    cookieValue: string,
    maxAgeInSeconds: number,
  ): void {
    response.cookie(cookieName, cookieValue, {
      ...cookieOptions,
      maxAge: maxAgeInSeconds * 1000,
      domain: this.signUrl,
    });
  }

  getCookie(
    request: Request,
    cookieName: ClientCookieNames,
  ): string | undefined {
    return request.cookies[cookieName] as string;
  }

  removeCookie(response: Response, cookieName: ClientCookieNames): void {
    response.clearCookie(cookieName, cookieOptions);
  }
}
