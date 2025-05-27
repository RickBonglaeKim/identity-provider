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
import { CookieOptions, Response } from 'express';
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

  private readonly passportExpirySeconds: number;
  private readonly tokenExpirySeconds: number;

  private readonly IDPcookieName: string;
  private readonly redirectCookieName: string;

  private readonly signinUrl: string;

  private readonly kakaoClientId: string;
  private readonly kakaoRedirectUri: string;

  private readonly naverClientId: string;
  private readonly naverClientSecret: string;
  private readonly naverRedirectUri: string;

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
    this.passportExpirySeconds =
      this.configService.getOrThrow<number>('PASSPORT_EXPIRE_IN');
    this.tokenExpirySeconds =
      this.configService.getOrThrow<number>('TOKEN_EXPIRE_IN');
    this.IDPcookieName =
      this.configService.getOrThrow<string>('IDP_COOKIE_NAME');
    this.redirectCookieName = this.configService.getOrThrow<string>(
      'REDIRECT_COOKIE_NAME',
    );
    this.signinUrl = this.configService.getOrThrow<string>('SIGN_IN_URL');
    this.kakaoClientId =
      this.configService.getOrThrow<string>('KAKAO_CLIENT_ID');
    this.kakaoRedirectUri =
      this.configService.getOrThrow<string>('KAKAO_REDIRECT_URI');
    this.naverClientId =
      this.configService.getOrThrow<string>('NAVER_CLIENT_ID');
    this.naverClientSecret = this.configService.getOrThrow<string>(
      'NAVER_CLIENT_SECRET',
    );
    this.naverRedirectUri =
      this.configService.getOrThrow<string>('NAVER_REDIRECT_URI');
  }

  private setCookie(
    response: Response,
    cookieName: string,
    cookieValue: string,
    cookieOptions: CookieOptions,
  ) {
    response.cookie(cookieName, cookieValue, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      ...cookieOptions,
    });
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
      return;
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
      return;
    }

    const authorizationCode = await this.oauthService.createAuthorizationCode(
      memberId,
      memberDetailId,
      passportKey,
      passport,
    );
    if (!authorizationCode) {
      const error: OauthError = 'server_error';
      response.redirect(`${this.signinUrl}?error=${error}`);
      return;
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

    response.cookie(this.IDPcookieName, encryptedCookieValue, {
      maxAge: this.tokenExpirySeconds * 1000,
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    const passportJson = JSON.parse(passport) as OauthAuthorizeRequestCreate;
    let redirectUrl = `${passportJson.redirect_uri}?code=${authorizationCode}`;
    if (passportJson.state) redirectUrl += `&state=${passportJson.state}`;
    this.logger.debug(`getSignin.redirectUrl -> ${redirectUrl}`);

    response.redirect(HttpStatus.TEMPORARY_REDIRECT, redirectUrl);
  }

  @Get('/provider/kakao')
  async getSigninKakao(
    @Res() response: Response,
    @Query('passport') passportKey: string,
  ) {
    this.logger.debug(`getSigninKakao.passportKey -> ${passportKey}`);
    const passport = await this.oauthService.findPassport(passportKey);
    this.logger.debug(`getSigninKakao.passport -> ${passport}`);
    if (!passport) {
      const error: OauthError = 'access_denied';
      response.redirect(`${this.signinUrl}?error=${error}`);
      return;
    }
    const { redirect_uri } = JSON.parse(
      passport,
    ) as OauthAuthorizeRequestCreate;
    this.setCookie(response, this.redirectCookieName, redirect_uri, {
      maxAge: this.passportExpirySeconds * 1000,
      signed: true,
    });
    const url: string = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${this.kakaoClientId}&redirect_uri=${this.kakaoRedirectUri}&state=${passportKey}`;
    this.logger.debug(`getSigninKakao.url -> ${url}`);
    response.redirect(HttpStatus.TEMPORARY_REDIRECT, url);
  }

  @Get('/provider/naver')
  async getSigninNaver(
    @Res() response: Response,
    @Query('passport') passportKey: string,
  ): Promise<void> {
    this.logger.debug(`getSigninNaver.passportKey -> ${passportKey}`);
    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      const error: OauthError = 'access_denied';
      response.redirect(`${this.signinUrl}?error=${error}`);
      return;
    }
    this.logger.debug(`getSigninNaver.passport -> ${passport}`);
    const { redirect_uri } = JSON.parse(
      passport,
    ) as OauthAuthorizeRequestCreate;
    this.setCookie(response, this.redirectCookieName, redirect_uri, {
      maxAge: this.passportExpirySeconds * 1000,
      signed: true,
    });

    const url: string = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${this.naverClientId}&redirect_uri=${this.naverRedirectUri}&state=${passportKey}`;
    this.logger.debug(`getSigninNaver.url -> ${url}`);
    response.redirect(HttpStatus.TEMPORARY_REDIRECT, url);
  }
}
