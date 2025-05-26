import { Controller, Get, Logger, Req, Res, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { SignCookie } from '../../type/service/sign.service.type';
import { OauthService } from '../../service/oauth/oauth.service';
import * as cryptoJS from 'crypto-js';

@Controller('signout')
export class SignOutController {
  private readonly logger = new Logger(SignOutController.name);
  private readonly signUrl: string;
  private readonly cookieName: string;
  private readonly cookieEncryptionKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OauthService,
  ) {
    this.signUrl = this.configService.getOrThrow<string>('SIGN_URL');
    this.cookieName = this.configService.getOrThrow<string>('COOKIE_NAME');
    this.cookieEncryptionKey = this.configService.getOrThrow<string>(
      'COOKIE_ENCRYPTION_KEY',
    );
  }

  @Get()
  async getSignout(
    @Req() request: Request,
    @Res() response: Response,
    @Query('return') returnUrl: string,
  ): Promise<void> {
    try {
      const encryptedCookieValue = request.cookies[this.cookieName] as
        | string
        | undefined;
      this.logger.debug(
        `getSignout.encryptedCookieValue -> ${encryptedCookieValue}`,
      );
      if (!encryptedCookieValue) throw new Error('The cookie does not exist.');

      const decryptedCookieValue = cryptoJS.AES.decrypt(
        encryptedCookieValue,
        this.cookieEncryptionKey,
      ).toString(cryptoJS.enc.Utf8);
      const signCookie = JSON.parse(decryptedCookieValue) as SignCookie;
      this.logger.debug(
        `getSignout.signCookie -> ${JSON.stringify(signCookie)}`,
      );
      if (!signCookie) throw new Error('The signCookie does not parsed.');

      const removedResult = await this.oauthService.removeAuthorizationToken(
        signCookie.memberId,
        signCookie.memberDetailId,
      );
      if (!removedResult) throw new Error('The cookie is not removed.');

      response.clearCookie(this.cookieName, {
        maxAge: -1,
        expires: new Date(-1),
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`getSignout.error -> ${message}`);
    } finally {
      if (returnUrl) response.redirect(returnUrl);
      // response.redirect(this.signUrl);
      response.redirect('/');
    }
  }
}
