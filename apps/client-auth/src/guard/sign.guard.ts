import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as cryptoJS from 'crypto-js';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { SignCookie } from '../type/service/sign.service.type';

declare module 'express' {
  interface Request {
    signCookie: SignCookie;
  }
}

@Injectable()
export class SignGuard implements CanActivate {
  private readonly logger = new Logger(SignGuard.name);
  private readonly IDPcookieName: string;
  private readonly cookieEncryptionKey: string;

  constructor(private readonly configService: ConfigService) {
    this.IDPcookieName =
      this.configService.getOrThrow<string>('IDP_COOKIE_NAME');
    this.cookieEncryptionKey = this.configService.getOrThrow<string>(
      'COOKIE_ENCRYPTION_KEY',
    );
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    try {
      this.logger.debug(
        `SignGuard.canActivate.cookieEncryptionKey -> ${this.cookieEncryptionKey}`,
      );
      const request = context.switchToHttp().getRequest<Request>();
      const encryptedCookieValue = request.cookies[this.IDPcookieName] as
        | string
        | undefined;
      this.logger.debug(
        `SignGuard.canActivate.encryptedCookieValue -> ${encryptedCookieValue}`,
      );
      if (!encryptedCookieValue) throw new Error('The cookie does not exist.');

      const decryptedCookieValue = cryptoJS.AES.decrypt(
        encryptedCookieValue,
        this.cookieEncryptionKey,
      ).toString(cryptoJS.enc.Utf8);
      const signCookie = JSON.parse(decryptedCookieValue) as SignCookie;
      this.logger.debug(
        `SignGuard.canActivate.signCookie -> ${JSON.stringify(signCookie)}`,
      );
      if (!signCookie) throw new Error('The signCookie does not parsed.');

      request.signCookie = signCookie;
      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`SignGuard.canActivate.error -> ${message}`);
      throw new HttpException(message, HttpStatus.UNAUTHORIZED);
    }
  }
}
