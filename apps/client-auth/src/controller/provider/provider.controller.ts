import {
  Controller,
  Get,
  HttpStatus,
  Query,
  Redirect,
  Req,
  Res,
} from '@nestjs/common';
import { ProviderService } from '../../service/provider/provider.service';
import { Response, Request } from 'express';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OauthInternalError } from '../../type/service/oauth.service.type';
import { OauthService } from '../../service/oauth/oauth.service';
import { OauthAuthorizeRequestCreate } from 'dto/interface/oauth/authorize/request/oauth.authorize.request.create.dto';
import { SignInService } from '../../service/sign.in/sign.in.service';
import { PROVIDER, Providers } from 'dto/enum/provider.enum';
import { ProviderData } from '../../type/service/provider.service.type';
import makeMemberProviderKey from '../../util/make.ProviderPassword';
import trimPhoneNumber from '../../util/trim.phoneNumber';
import * as cryptoJS from 'crypto-js';
import { SignMember } from '../../type/service/sign.service.type';

@Controller('provider')
export class ProviderController {
  private readonly logger = new Logger(ProviderController.name);
  private readonly signInUrl: string;
  private readonly signUpUrl: string;
  private readonly redirectCookieName: string;
  private readonly memberKeyEncryptionKey: string;

  constructor(
    private readonly providerService: ProviderService,
    private readonly configService: ConfigService,
    private readonly signInService: SignInService,
  ) {
    this.signInUrl = this.configService.getOrThrow<string>('SIGN_IN_URL');
    this.signUpUrl = this.configService.getOrThrow<string>('SIGN_UP_URL');
    this.redirectCookieName = this.configService.getOrThrow<string>(
      'REDIRECT_COOKIE_NAME',
    );
    this.memberKeyEncryptionKey = this.configService.getOrThrow<string>(
      'MEMBER_KEY_ENCRYPTION_KEY',
    );
  }

  private combineAuthorizationErrorUrl(
    url: string,
    code?: string,
    state?: string,
  ): string | undefined {
    if (!code) return this.combineErrorUrl(url, 'invalid_code');
    if (!state) return this.combineErrorUrl(url, 'invalid_state');
    return;
  }

  private combineErrorUrl(
    url: string,
    error: OauthInternalError,
    error_description?: string,
  ): string {
    url += `&error=${error}`;
    if (error_description) url += `&error_description=${error_description}`;
    return url;
  }

  private combineRedirectUrlWithError(
    request: Request,
    error: string,
    errorDescription?: string,
  ): string {
    let url = request.signedCookies[this.redirectCookieName] as string;
    this.logger.debug(`combineRedirectUrlWithError.url -> ${url}`);
    url += `?error=${error}`;
    if (errorDescription) url += `&error_description=${errorDescription}`;
    return url;
  }

  private combineSignUpUrl(
    providerId: Providers,
    passportKey: string,
    providerData: ProviderData,
  ): string {
    const memberProviderKey = makeMemberProviderKey(
      providerId,
      providerData.id,
    );
    let signUpUrl = `${this.signUpUrl}?provider=${providerId}&passport=${passportKey}&memberProviderKey=${memberProviderKey}`;
    if (providerData.name) signUpUrl += `&name=${providerData.name}`;
    if (providerData.email) signUpUrl += `&email=${providerData.email}`;
    if (providerData.phone) {
      signUpUrl += `&countryCallingCode=${providerData.phone.countryCallingCode}`;
      signUpUrl += `&phoneNumber=${trimPhoneNumber(providerData.phone.phoneNumber)}`;
    }
    return signUpUrl;
  }

  private generateSignInUrl(
    signMember: SignMember,
    passportKey: string,
  ): string {
    const memberKey = cryptoJS.AES.encrypt(
      JSON.stringify({
        memberId: signMember.memberId,
        memberDetailId: signMember.memberDetailId,
        passportKey: passportKey,
        timestamp: Date.now(),
      }),
      this.memberKeyEncryptionKey,
    ).toString();
    return `/signin/${encodeURIComponent(memberKey)}`;
  }

  @Get('kakao')
  async getKakao(
    @Req() request: Request,
    @Res() response: Response,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
    @Query('error_description') error_description?: string,
  ): Promise<void> {
    this.logger.debug(
      `getKakao.code -> ${code}`,
      `getKakao.state -> ${state}`,
      `getKakao.error -> ${error}`,
      `getKakao.error_description -> ${error_description}`,
    );

    if (error) {
      response.redirect(
        this.combineRedirectUrlWithError(request, error, error_description),
      );
    }

    let signInUrl = `${this.signInUrl}?provider=${PROVIDER.KAKAO}`;
    const signInErrorUrl = this.combineAuthorizationErrorUrl(
      signInUrl,
      code,
      state,
    );
    if (signInErrorUrl) {
      response.redirect(HttpStatus.TEMPORARY_REDIRECT, signInErrorUrl);
    }

    const passportKey = state!;
    signInUrl += `&passport=${passportKey}`;

    const kakao = await this.providerService.connectKakao(code!);
    if (!kakao) {
      response.redirect(
        HttpStatus.TEMPORARY_REDIRECT,
        this.combineErrorUrl(signInUrl, 'invalid_kakao'),
      );
    }

    const member = await this.signInService.findMemberByMemberProvider(
      makeMemberProviderKey(PROVIDER.KAKAO, kakao.id),
    );

    if (member) {
      response.redirect(
        HttpStatus.TEMPORARY_REDIRECT,
        this.generateSignInUrl(member, passportKey),
      );
    }

    // The member searched by the Kakao does not exist in the database.
    response.redirect(
      HttpStatus.TEMPORARY_REDIRECT,
      this.combineSignUpUrl(PROVIDER.KAKAO, passportKey, kakao),
    );
  }

  @Get('naver')
  async getNaver(
    @Req() request: Request,
    @Res() response: Response,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
    @Query('error_description') error_description?: string,
  ) {
    this.logger.debug(
      `getNaver.code -> ${code}`,
      `getNaver.state -> ${state}`,
      `getNaver.error -> ${error}`,
      `getNaver.error_description -> ${error_description}`,
    );

    if (error) {
      response.redirect(
        this.combineRedirectUrlWithError(request, error, error_description),
      );
    }

    let signInUrl = `${this.signInUrl}?provider=${PROVIDER.NAVER}`;

    const signInErrorUrl = this.combineAuthorizationErrorUrl(
      signInUrl,
      code,
      state,
    );
    if (signInErrorUrl) {
      response.redirect(HttpStatus.TEMPORARY_REDIRECT, signInErrorUrl);
    }

    const passportKey = state!;
    signInUrl += `&passport=${passportKey}`;

    const naver = await this.providerService.connectNaver(code!);
    if (!naver) {
      response.redirect(
        HttpStatus.TEMPORARY_REDIRECT,
        this.combineErrorUrl(signInUrl, 'invalid_naver'),
      );
    }

    const member = await this.signInService.findMemberByMemberProvider(
      makeMemberProviderKey(PROVIDER.NAVER, naver.id),
    );

    if (member) {
      response.redirect(
        HttpStatus.TEMPORARY_REDIRECT,
        this.generateSignInUrl(member, passportKey),
      );
    }

    // The member searched by the Naver does not exist in the database.
    response.redirect(
      HttpStatus.TEMPORARY_REDIRECT,
      this.combineSignUpUrl(PROVIDER.NAVER, passportKey, naver),
    );
  }

  @Get('google')
  getGoogle() {
    // TODO: 구글 로그인 구현
    throw new Error('Not implemented');
  }

  @Get('apple')
  getApple() {
    // TODO: 애플 로그인 구현
    throw new Error('Not implemented');
  }
}
