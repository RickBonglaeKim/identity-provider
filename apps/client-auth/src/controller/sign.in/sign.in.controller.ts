import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import { SigninRequestCreate } from 'dto/interface/sign.in/request/sign.in.request.create.dto';
import {
  Controller,
  Logger,
  Res,
  Post,
  Body,
  UseInterceptors,
  Get,
  HttpStatus,
  Param,
  Query,
  Redirect,
} from '@nestjs/common';
import { SigninService } from '../../service/sign.in/sign.in.service';
import { Response } from 'express';
import { OauthService } from '../../service/oauth/oauth.service';
import { OauthAuthorizeRequestCreate } from 'dto/interface/oauth/authorize/request/oauth.authorize.request.create.dto';
import { ConfigService } from '@nestjs/config';
import * as cryptoJS from 'crypto-js';
import { MemberKey, SignCookie } from '../../type/service/sign.service.type';
import { OauthError } from '../../type/service/oauth.service.type';

@Controller('signin')
@UseInterceptors(TransformInterceptor)
export class SignInController {
  private readonly logger = new Logger(SignInController.name);
  private readonly cookieEncryptionKey: string;
  private readonly memberKeyEncryptionKey: string;
  private readonly tokenExpirySeconds: number;
  private readonly cookieName: string;
  private readonly signinUrl: string;
  private readonly kakao_client_id: string;
  private readonly kakao_redirect_uri: string;
  private readonly naver_client_id: string;
  private readonly naver_redirect_uri: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly signinService: SigninService,
    private readonly oauthService: OauthService,
  ) {
    this.cookieEncryptionKey = this.configService.getOrThrow<string>(
      'COOKIE_ENCRYPTION_KEY',
    );
    this.memberKeyEncryptionKey = this.configService.getOrThrow<string>(
      'MEMBER_KEY_ENCRYPTION_KEY',
    );
    this.tokenExpirySeconds =
      this.configService.getOrThrow<number>('TOKEN_EXPIRE_IN');
    this.cookieName = this.configService.getOrThrow<string>('COOKIE_NAME');
    this.signinUrl = this.configService.getOrThrow<string>('SIGN_IN_URL');
    this.kakao_client_id =
      this.configService.getOrThrow<string>('KAKAO_CLIENT_ID');
    this.configService.getOrThrow<string>('KAKAO_REDIRECT_URI');
  }

  @Post()
  async postSignin(
    @Res({ passthrough: true }) response: Response,
    @Body() dto: SigninRequestCreate,
  ): Promise<void | string> {
    const passport = await this.oauthService.findPassport(dto.passport);
    if (!passport) {
      this.logger.error(`The passport does not exist in the cache.`);
      response.status(251);
      return;
    }

    const member = await this.signinService.findMember(dto.email, dto.password);
    this.logger.debug(`getSignin.memberId -> ${JSON.stringify(member)}`);
    if (!member) {
      this.logger.error(`The member does not exist in the database.`);
      response.status(252);
      return;
    }

    const memberKey = cryptoJS.AES.encrypt(
      JSON.stringify({
        memberId: member.memberId,
        memberDetailId: member.memberDetailId,
        passportKey: dto.passport,
        timestamp: Date.now(),
      }),
      this.memberKeyEncryptionKey,
    ).toString();
    this.logger.debug(`postSignin.memberKey -> ${memberKey}`);
    const decryptedMemberValue = cryptoJS.AES.decrypt(
      memberKey,
      this.memberKeyEncryptionKey,
    ).toString(cryptoJS.enc.Utf8);
    this.logger.debug(
      `postSignin.decryptedMemberValue -> ${decryptedMemberValue}`,
    );

    return encodeURIComponent(memberKey);
  }

  @Get('/:memberKey')
  async getSignin(
    @Res() response: Response,
    @Param('memberKey') memberKey: string,
  ): Promise<void> {
    this.logger.debug(`getSignin.memberKey -> ${memberKey}`);
    const memberValue = cryptoJS.AES.decrypt(
      decodeURIComponent(memberKey),
      this.memberKeyEncryptionKey,
    ).toString(cryptoJS.enc.Utf8);
    this.logger.debug(`getSignin.memberValue -> ${memberValue}`);
    if (!memberValue) {
      const error: OauthError = 'access_denied';
      response.redirect(`${this.signinUrl}?error=${error}`);
    }

    const { memberId, memberDetailId, passportKey, timestamp } = JSON.parse(
      memberValue,
    ) as MemberKey;
    this.logger.debug(`getSignin.memberId -> ${memberId}`);
    this.logger.debug(`getSignin.memberDetailId -> ${memberDetailId}`);
    this.logger.debug(`getSignin.passportKey -> ${passportKey}`);
    this.logger.debug(`getSignin.timestamp -> ${timestamp}`);
    // if (timestamp + 1000 * 100 < Date.now()) {
    //   response.redirect(`${this.signUrl}?error=access_denied`);
    // }

    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      const error: OauthError = 'unauthorized_client';
      response.redirect(`${this.signinUrl}?error=${error}`);
    }

    const authorizationCode = await this.oauthService.createAuthorizationCode(
      memberId,
      memberDetailId,
      passportKey,
      passport!,
    );
    if (!authorizationCode) {
      const error: OauthError = 'server_error';
      response.redirect(`${this.signinUrl}?error=${error}`);
    }

    // set cookie
    const signCookie: SignCookie = {
      memberId,
      memberDetailId,
      timestamp: Date.now(),
    };
    const encryptedCookieValue = cryptoJS.AES.encrypt(
      JSON.stringify(signCookie),
      this.cookieEncryptionKey,
    ).toString();
    this.logger.debug(
      `getSignin.encryptedCookieValue -> ${encryptedCookieValue}`,
    );

    response.cookie(this.cookieName, encryptedCookieValue, {
      maxAge: this.tokenExpirySeconds * 1000,
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    const passportJson = JSON.parse(passport!) as OauthAuthorizeRequestCreate;
    let redirectUrl = `${passportJson.redirect_uri}?code=${authorizationCode}`;
    if (passportJson.state) redirectUrl += `&state=${passportJson.state}`;
    this.logger.debug(`getSignin.redirectUrl -> ${redirectUrl}`);

    response.redirect(HttpStatus.TEMPORARY_REDIRECT, redirectUrl);
  }

  @Get('/provider/kakao')
  getSigninKakao(
    @Res() response: Response,
    @Query('passport') passport: string,
  ) {
    this.logger.debug(`getSigninKakao.passport -> ${passport}`);
    const url: string = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${this.kakao_client_id}&redirect_uri=${this.kakao_redirect_uri}&state=${passport}`;
    this.logger.debug(`getSigninKakao.url -> ${url}`);
    response.redirect(HttpStatus.PERMANENT_REDIRECT, url);
  }

  @Get('/provider/naver')
  getSigninNaver(
    @Res() response: Response,
    @Query('passport') passport: string,
  ) {
    this.logger.debug(`getSigninNaver.passport -> ${passport}`);
    const url: string = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${this.naver_client_id}&redirect_uri=${this.naver_redirect_uri}&state=${passport}`;
    this.logger.debug(`getSigninNaver.url -> ${url}`);
    response.redirect(HttpStatus.PERMANENT_REDIRECT, url);
  }
}
