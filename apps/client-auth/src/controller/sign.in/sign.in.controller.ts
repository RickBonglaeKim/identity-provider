import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import { SigninRequestCreate } from 'dto/interface/sign.in/request/sign.in.request.create.dto';
import {
  Controller,
  Logger,
  Res,
  HttpStatus,
  Post,
  Body,
  UseInterceptors,
  HttpException,
  Redirect,
} from '@nestjs/common';
import { SigninService } from '../../service/sign.in/sign.in.service';
import { Response } from 'express';
import { OauthService } from '../../service/oauth/oauth.service';
import { OauthAuthorizeRequestCreate } from 'dto/interface/oauth/authorize/request/oauth.authorize.request.create.dto';
import { ConfigService } from '@nestjs/config';
import * as cryptoJS from 'crypto-js';
import { CookieValue } from '../../type/service/sign.service.type';

@Controller('signin')
@UseInterceptors(TransformInterceptor)
export class SignInController {
  private readonly logger = new Logger(SignInController.name);
  private readonly cookieEncryptionKey: string;
  private readonly tokenExpirySeconds: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly signinService: SigninService,
    private readonly oauthService: OauthService,
  ) {
    this.cookieEncryptionKey = this.configService.getOrThrow<string>(
      'COOKIE_ENCRYPTION_KEY',
    );
    this.tokenExpirySeconds =
      this.configService.getOrThrow<number>('TOKEN_EXPIRE_IN');
  }

  @Post()
  async postSignin(
    @Res() response: Response,
    @Body() dto: SigninRequestCreate,
  ): Promise<string | void> {
    const passport = await this.oauthService.findPassport(dto.passport);
    if (!passport) {
      this.logger.error(`passport -> ${passport}`);
      response.status(251);
      return;
    }

    const member = await this.signinService.findMember(dto.email, dto.password);
    this.logger.debug(`getSignin.memberId -> ${JSON.stringify(member)}`);
    if (!member) {
      this.logger.error(member);
      response.status(252);
      return;
    }

    const authorizationCode = await this.oauthService.createAuthorizationCode(
      member.memberId,
      member.memberDetailId,
      dto.passport,
      passport,
    );

    if (!authorizationCode) {
      throw new HttpException(
        'It fails to create authorization code.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // set cookie
    const cookieValue: CookieValue = {
      memberId: member.memberId,
      memberDetailId: member.memberDetailId,
      timestamp: Date.now(),
    };
    const encryptedCookieValue = cryptoJS.AES.encrypt(
      JSON.stringify(cookieValue),
      this.cookieEncryptionKey,
    ).toString();
    this.logger.debug(
      `postSignin.encryptedCookieValue -> ${encryptedCookieValue}`,
    );
    this.logger.debug(
      cryptoJS.AES.decrypt(
        encryptedCookieValue,
        this.cookieEncryptionKey,
      ).toString(cryptoJS.enc.Utf8),
    );
    response.cookie('iScreamArts-IDP', encryptedCookieValue, {
      maxAge: this.tokenExpirySeconds * 1000,
      httpOnly: true,
      secure: false,
      sameSite: 'none',
    });

    const passportJson = JSON.parse(passport) as OauthAuthorizeRequestCreate;
    let redirectUrl = `${passportJson.redirect_uri}?code=${authorizationCode}`;
    if (passportJson.state) redirectUrl += `&state=${passportJson.state}`;

    this.logger.debug(`getSignin.redirectUrl -> ${redirectUrl}`);
    return redirectUrl;
    // response.redirect(308, redirectUrl);
  }
}
