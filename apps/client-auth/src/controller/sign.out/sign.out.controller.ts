import { Controller, Get, Logger, Req, Res, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import * as cryptoJS from 'crypto-js';
import { CookieValue } from '../../type/service/sign.service.type';
import { OauthService } from '../../service/oauth/oauth.service';

@Controller('signout')
export class SignOutController {
  private readonly logger = new Logger(SignOutController.name);
  private readonly cookieEncryptionKey: string;
  private readonly signUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OauthService,
  ) {
    this.cookieEncryptionKey = this.configService.getOrThrow<string>(
      'COOKIE_ENCRYPTION_KEY',
    );
    this.signUrl = this.configService.getOrThrow<string>('SIGN_URL');
  }

  @Get()
  async getSignout(
    @Req() request: Request,
    @Res() response: Response,
    @Query('return') returnUrl: string,
  ): Promise<void> {
    try {
      const encryptedCookieValue = request.cookies['iScreamArts-IDP'] as string;
      if (!encryptedCookieValue) throw new Error('The cookie does not exist.');
      this.logger.debug(
        `getSignout.encryptedCookieValue -> ${encryptedCookieValue}`,
      );

      const decryptedCookieValue = cryptoJS.AES.decrypt(
        encryptedCookieValue,
        this.cookieEncryptionKey,
      ).toString(cryptoJS.enc.Utf8);
      const signMember = JSON.parse(decryptedCookieValue) as CookieValue;
      if (!signMember) throw new Error('The cookie is invalid.');
      this.logger.debug(
        `getSignout.signMember -> ${JSON.stringify(signMember)}`,
      );

      const removedResult = await this.oauthService.removeAuthorizationToken(
        signMember.memberId,
        signMember.memberDetailId,
      );
      if (!removedResult) throw new Error('The cookie is not removed.');

      response.clearCookie('iScreamArts-IDP', {
        maxAge: 0,
        expires: new Date(0),
      });
    } catch (error) {
      if (returnUrl) response.redirect(returnUrl);
      response.redirect(this.signUrl);
    }
  }
}
