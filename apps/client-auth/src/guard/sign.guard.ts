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
import { COOKIE_NAME } from '../enum/cookie.name.enum';
import { CookieHandler } from '../util/cookie.handler';

declare module 'express' {
  interface Request {
    signCookie: SignCookie;
  }
}

@Injectable()
export class SignGuard implements CanActivate {
  private readonly logger = new Logger(SignGuard.name);
  private readonly cookieEncryptionKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly cookieHandler: CookieHandler,
  ) {
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
      const signCookie = this.cookieHandler.getSignInCookie(request);

      this.logger.debug(
        `SignGuard.canActivate.signCookie -> ${JSON.stringify(signCookie)}`,
      );
      if (!signCookie) {
        throw new Error('The authentication cookie does not exist.');
      }

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
