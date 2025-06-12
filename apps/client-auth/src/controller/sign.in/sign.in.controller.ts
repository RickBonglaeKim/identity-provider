import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import { SignInRequestCreate } from 'dto/interface/sign.in/request/sign.in.request.create.dto';
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
  HttpException,
} from '@nestjs/common';
import { SignInService } from '../../service/sign.in/sign.in.service';
import { CookieOptions, Response } from 'express';
import { OauthService } from '../../service/oauth/oauth.service';
import { OauthAuthorizeRequestCreate } from 'dto/interface/oauth/authorize/request/oauth.authorize.request.create.dto';
import { ConfigService } from '@nestjs/config';
import * as cryptoJS from 'crypto-js';
import { MemberKey, SignCookie } from '../../type/service/sign.service.type';
import { OauthError } from '../../type/service/oauth.service.type';
import { CookieHandler } from '../../util/cookie.handler';
import { COOKIE_NAME } from '../../enum/cookie.name.enum';
import { Passport } from '../../decorator/passport.decorator';
import SUCCESS_HTTP_STATUS from 'dto/constant/http.status.constant';
import ERROR_MESSAGE from 'dto/constant/http.error.message.constant';

@Controller('signin')
@UseInterceptors(TransformInterceptor)
export class SignInController {
  private readonly logger = new Logger(SignInController.name);
  private readonly memberKeyEncryptionKey: string;

  private readonly passportExpirySeconds: number;
  private readonly tokenExpirySeconds: number;

  private readonly signInUrl: string;

  private readonly kakaoClientId: string;
  private readonly kakaoRedirectUri: string;

  private readonly naverClientId: string;
  private readonly naverRedirectUri: string;

  private readonly googleClientId: string;
  private readonly googleRedirectUri: string;

  private readonly appleClientId: string;
  private readonly appleRedirectUri: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly cookieHandler: CookieHandler,
    private readonly signInService: SignInService,
    private readonly oauthService: OauthService,
  ) {
    this.memberKeyEncryptionKey = this.configService.getOrThrow<string>(
      'MEMBER_KEY_ENCRYPTION_KEY',
    );
    this.passportExpirySeconds =
      this.configService.getOrThrow<number>('PASSPORT_EXPIRE_IN');
    this.tokenExpirySeconds =
      this.configService.getOrThrow<number>('TOKEN_EXPIRE_IN');
    this.signInUrl = this.configService.getOrThrow<string>('SIGN_IN_URL');
    this.kakaoClientId =
      this.configService.getOrThrow<string>('KAKAO_CLIENT_ID');
    this.kakaoRedirectUri =
      this.configService.getOrThrow<string>('KAKAO_REDIRECT_URI');
    this.naverClientId =
      this.configService.getOrThrow<string>('NAVER_CLIENT_ID');
    this.naverRedirectUri =
      this.configService.getOrThrow<string>('NAVER_REDIRECT_URI');
    this.googleClientId =
      this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
    this.googleRedirectUri = this.configService.getOrThrow<string>(
      'GOOGLE_REDIRECT_URI',
    );
    this.appleClientId =
      this.configService.getOrThrow<string>('APPLE_CLIENT_ID');
    this.appleRedirectUri =
      this.configService.getOrThrow<string>('APPLE_REDIRECT_URI');
  }

  @Post()
  async postSignIn(
    @Passport() passportKey: string,
    @Res({ passthrough: true }) response: Response,
    @Body() dto: SignInRequestCreate,
  ): Promise<void | string> {
    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      throw new HttpException(
        ERROR_MESSAGE.PASSPORT_NOT_FOUND,
        HttpStatus.FORBIDDEN,
      );
    }

    const member = await this.signInService.findMember(dto.email, dto.password);
    this.logger.debug(`getSignIn.memberId -> ${JSON.stringify(member)}`);
    if (!member) {
      this.logger.debug(`The member does not exist in the database.`);
      response.status(SUCCESS_HTTP_STATUS.DATA_NOT_FOUND);
      return;
    }

    let memberKey: string | undefined;
    try {
      memberKey = cryptoJS.AES.encrypt(
        JSON.stringify({
          memberId: member.memberId,
          memberDetailId: member.memberDetailId,
          passportKey: passportKey,
          timestamp: Date.now(),
        }),
        this.memberKeyEncryptionKey,
      ).toString();
      this.logger.debug(`postSignIn.memberKey -> ${memberKey}`);
    } catch (error) {
      this.logger.error(`postSignIn.error -> ${error}`);
      throw new HttpException(
        'The memberKey was not created',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (memberKey) {
      return encodeURIComponent(memberKey);
    }
    return;
  }

  @Get('/:memberKey')
  async getSignIn(
    @Res() response: Response,
    @Param('memberKey') memberKey: string,
  ): Promise<void> {
    this.logger.debug(`getSignIn.memberKey -> ${memberKey}`);

    let memberValue: string | undefined;
    try {
      memberValue = cryptoJS.AES.decrypt(
        decodeURIComponent(memberKey),
        this.memberKeyEncryptionKey,
      ).toString(cryptoJS.enc.Utf8);
      this.logger.debug(`getSignIn.memberValue -> ${memberValue}`);
    } catch (error) {
      this.logger.error(`getSignIn.error -> ${error}`);
    }

    if (!memberValue) {
      const error: OauthError = 'access_denied';
      response.redirect(`${this.signInUrl}?error=${error}`);
      return;
    }

    const { memberId, memberDetailId, passportKey, timestamp } = JSON.parse(
      memberValue,
    ) as MemberKey;
    this.logger.debug(`getSignIn.memberId -> ${memberId}`);
    this.logger.debug(`getSignIn.memberDetailId -> ${memberDetailId}`);
    this.logger.debug(`getSignIn.passportKey -> ${passportKey}`);
    this.logger.debug(`getSignIn.timestamp -> ${timestamp}`);
    // if (timestamp + 1000 * 100 < Date.now()) {
    //   response.redirect(`${this.signUrl}?error=access_denied`);
    // }

    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      const error: OauthError = 'unauthorized_client';
      response.redirect(`${this.signInUrl}?error=${error}`);
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
      response.redirect(`${this.signInUrl}?error=${error}`);
      return;
    }

    // set cookie
    const signCookie: SignCookie = {
      memberId,
      memberDetailId,
      timestamp: Date.now(),
    };
    this.cookieHandler.setCookie(
      response,
      COOKIE_NAME.IDP,
      JSON.stringify(signCookie),
      this.tokenExpirySeconds,
    );

    const passportJson = JSON.parse(passport) as OauthAuthorizeRequestCreate;
    let redirectUrl = `${passportJson.redirect_uri}?code=${authorizationCode}`;
    if (passportJson.state) redirectUrl += `&state=${passportJson.state}`;
    this.logger.debug(`getSignIn.redirectUrl -> ${redirectUrl}`);

    response.redirect(HttpStatus.TEMPORARY_REDIRECT, redirectUrl);
  }

  @Get('/provider/kakao')
  async getSignInKakao(
    @Res() response: Response,
    @Query('passport') passportKey: string,
  ): Promise<void> {
    this.logger.debug(`getSignInKakao.passportKey -> ${passportKey}`);
    const passport = await this.oauthService.findPassport(passportKey);
    this.logger.debug(`getSignInKakao.passport -> ${passport}`);
    if (!passport) {
      const error: OauthError = 'access_denied';
      response.redirect(`${this.signInUrl}?error=${error}`);
      return;
    }
    const { redirect_uri } = JSON.parse(
      passport,
    ) as OauthAuthorizeRequestCreate;
    this.cookieHandler.setCookie(
      response,
      COOKIE_NAME.REDIRECT,
      redirect_uri,
      this.passportExpirySeconds,
    );
    let url = `https://kauth.kakao.com/oauth/authorize`;
    url += `?response_type=code`;
    url += `&client_id=${this.kakaoClientId}`;
    url += `&redirect_uri=${this.kakaoRedirectUri}`;
    url += `&state=${passportKey}`;
    this.logger.debug(`getSignInKakao.url -> ${url}`);
    response.redirect(HttpStatus.TEMPORARY_REDIRECT, url);
    return;
  }

  @Get('/provider/naver')
  async getSignInNaver(
    @Res() response: Response,
    @Query('passport') passportKey: string,
  ): Promise<void> {
    this.logger.debug(`getSignInNaver.passportKey -> ${passportKey}`);
    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      const error: OauthError = 'access_denied';
      response.redirect(`${this.signInUrl}?error=${error}`);
      return;
    }
    this.logger.debug(`getSignInNaver.passport -> ${passport}`);
    const { redirect_uri } = JSON.parse(
      passport,
    ) as OauthAuthorizeRequestCreate;
    this.cookieHandler.setCookie(
      response,
      COOKIE_NAME.REDIRECT,
      redirect_uri,
      this.passportExpirySeconds,
    );
    let url = `https://nid.naver.com/oauth2.0/authorize`;
    url += `?response_type=code`;
    url += `&client_id=${this.naverClientId}`;
    url += `&redirect_uri=${this.naverRedirectUri}`;
    url += `&state=${passportKey}`;
    this.logger.debug(`getSignInNaver.url -> ${url}`);
    response.redirect(HttpStatus.TEMPORARY_REDIRECT, url);
    return;
  }

  @Get('/provider/google')
  async getSignInGoogle(
    @Res() response: Response,
    @Query('passport') passportKey: string,
  ): Promise<void> {
    this.logger.debug(`getSignInGoogle.passportKey -> ${passportKey}`);
    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      const error: OauthError = 'access_denied';
      response.redirect(`${this.signInUrl}?error=${error}`);
      return;
    }
    this.logger.debug(`getSignInGoogle.passport -> ${passport}`);
    const { redirect_uri } = JSON.parse(
      passport,
    ) as OauthAuthorizeRequestCreate;
    this.cookieHandler.setCookie(
      response,
      COOKIE_NAME.REDIRECT,
      redirect_uri,
      this.passportExpirySeconds,
    );

    let url = `https://accounts.google.com/o/oauth2/v2/auth`;
    url += `?response_type=code`;
    url += `&client_id=${this.googleClientId}`;
    url += `&redirect_uri=${this.googleRedirectUri}`;
    url += `&scope=email%20profile`;
    url += `&state=${passportKey}`;
    this.logger.debug(`getSignInGoogle.url -> ${url}`);
    response.redirect(HttpStatus.TEMPORARY_REDIRECT, url);
    return;
  }

  @Get('/provider/apple')
  async getSignInApple(
    @Res() response: Response,
    @Query('passport') passportKey: string,
  ) {
    this.logger.debug(`getSignInApple.passportKey -> ${passportKey}`);
    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      const error: OauthError = 'access_denied';
      response.redirect(`${this.signInUrl}?error=${error}`);
      return;
    }
    this.logger.debug(`getSignInApple.passport -> ${passport}`);
    const { redirect_uri } = JSON.parse(
      passport,
    ) as OauthAuthorizeRequestCreate;
    this.cookieHandler.setCookie(
      response,
      COOKIE_NAME.REDIRECT,
      redirect_uri,
      this.passportExpirySeconds,
    );

    let url = `https://appleid.apple.com/auth/authorize`;
    url += `?response_type=code`;
    url += `&client_id=${this.appleClientId}`;
    url += `&redirect_uri=${this.appleRedirectUri}`;
    url += `&scope=email%20name`;
    url += `&response_mode=form_post`;
    url += `&state=${passportKey}`;
    this.logger.debug(`getSignInApple.url -> ${url}`);
    response.redirect(HttpStatus.TEMPORARY_REDIRECT, url);
    return;
  }
}
