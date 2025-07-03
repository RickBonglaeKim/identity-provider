import { Injectable, Logger } from '@nestjs/common';
import { CookieHandler } from '../../util/cookie.handler';
import { Response } from 'express';
import { COOKIE_NAME } from '../../enum/cookie.name.enum';

@Injectable()
export class SignOutService {
  private readonly logger = new Logger(SignOutService.name);

  constructor(private readonly cookieHandler: CookieHandler) {}

  signOut(response: Response): void {
    this.cookieHandler.removeCookie(response, COOKIE_NAME.IDP);
  }
}
