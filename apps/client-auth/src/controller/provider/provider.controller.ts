import { Controller, Get, Query, Redirect, Res } from '@nestjs/common';
import { ProviderService } from '../../service/provider/provider.service';
import { Response } from 'express';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OauthInternalError } from '../../type/service/oauth.service.type';
import { OauthService } from '../../service/oauth/oauth.service';
import { OauthAuthorizeRequestCreate } from 'dto/interface/oauth/authorize/request/oauth.authorize.request.create.dto';
import { SigninService } from '../../service/sign.in/sign.in.service';
import { PROVIDER, Providers } from 'dto/enum/provider.enum';
import makeProviderPassword from '../../util/make.ProviderPassword';
import makePhoneNumber from '../../util/make.phoneNumber';
import { ProviderData } from '../../type/service/provider.service.type';

@Controller('provider')
export class ProviderController {
  private readonly logger = new Logger(ProviderController.name);
  private readonly signinUrl: string;
  private readonly signupUrl: string;

  constructor(
    private readonly providerService: ProviderService,
    private readonly configService: ConfigService,
    private readonly oauthService: OauthService,
    private readonly signinService: SigninService,
  ) {
    this.signinUrl = this.configService.getOrThrow<string>('SIGN_IN_URL');
    this.signupUrl = this.configService.getOrThrow<string>('SIGN_UP_URL');
  }

  private combineAuthorizationErrorUrl(
    signinUrl: string,
    code?: string,
    state?: string,
    error?: string,
    error_description?: string,
  ): string | undefined {
    if (error) {
      signinUrl += `&error=${error}&error_description=${error_description}`;
      return signinUrl;
    }
    if (!code) return this.combineErrorUrl(signinUrl, 'invalid_code');
    if (!state) return this.combineErrorUrl(signinUrl, 'invalid_state');
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

  private combineRedirectUrl(
    url: string,
    code: string,
    state?: string,
  ): string {
    let redirectUrl = `${url}?code=${code}`;
    if (state) {
      redirectUrl += `&state=${state}`;
    }

    return redirectUrl;
  }

  private combineSignupUrl(
    providerId: Providers,
    passportKey: string,
    providerData: ProviderData,
  ): string {
    let signupUrl = `${this.signupUrl}?provider=${providerId}&passport=${passportKey}&id=${providerData.id}`;
    if (providerData.name) signupUrl += `&name=${providerData.name}`;
    if (providerData.email) signupUrl += `&email=${providerData.email}`;
    if (providerData.phone) {
      signupUrl += `&phone=${makePhoneNumber(
        providerData.phone.countryCallingCode,
        providerData.phone.phoneNumber,
      )}`;
    }

    return signupUrl;
  }

  @Get('kakao')
  async getKakao(
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
    let signinUrl = `${this.signinUrl}?provider=${PROVIDER.KAKAO}`;
    const signinErrorUrl = this.combineAuthorizationErrorUrl(
      signinUrl,
      code,
      state,
      error,
      error_description,
    );
    if (signinErrorUrl) {
      response.redirect(signinErrorUrl);
    }

    const passportKey = state!;

    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      const error: OauthInternalError = 'invalid_passport';
      response.redirect(`${signinUrl}&error=${error}`);
    }
    signinUrl += `&passport=${passport}`;
    const authorizationData = JSON.parse(
      passport!,
    ) as OauthAuthorizeRequestCreate;

    const kakao = await this.providerService.connectKakao(code!);
    if (!kakao) {
      const error: OauthInternalError = 'invalid_kakao';
      response.redirect(`${signinUrl}&error=${error}`);
    }

    const member = await this.signinService.findMemberByProvider(
      makeProviderPassword(PROVIDER.KAKAO, kakao.id),
    );
    if (member) {
      const authorizationCode = await this.oauthService.createAuthorizationCode(
        member.memberId,
        member.memberDetailId,
        passportKey,
        passport!,
      );
      let redirectUrl = `${authorizationData.redirect_uri}?code=${authorizationCode}`;
      if (authorizationData.state) {
        redirectUrl += `&state=${authorizationData.state}`;
      }
      response.redirect(
        this.combineRedirectUrl(
          redirectUrl,
          authorizationCode!,
          authorizationData.state,
        ),
      );
    }

    const signupUrl = this.combineSignupUrl(PROVIDER.KAKAO, passportKey, kakao);
    response.redirect(signupUrl);
  }

  @Get('naver')
  async getNaver(
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
    let signinUrl = `${this.signinUrl}?provider=${PROVIDER.NAVER}`;
    const signinErrorUrl = this.combineAuthorizationErrorUrl(
      signinUrl,
      code,
      state,
      error,
      error_description,
    );
    if (signinErrorUrl) {
      response.redirect(signinErrorUrl);
    }

    const passportKey = state!;

    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      const error: OauthInternalError = 'invalid_passport';
      response.redirect(`${signinUrl}&error=${error}`);
    }
    signinUrl += `&passport=${passport}`;
    const authorizationData = JSON.parse(
      passport!,
    ) as OauthAuthorizeRequestCreate;

    const naver = await this.providerService.connectNaver(code!);
    if (!naver) {
      const error: OauthInternalError = 'invalid_naver';
      response.redirect(`${signinUrl}&error=${error}`);
    }

    const member = await this.signinService.findMemberByProvider(
      makeProviderPassword(PROVIDER.NAVER, naver.id),
    );
    if (member) {
      const authorizationCode = await this.oauthService.createAuthorizationCode(
        member.memberId,
        member.memberDetailId,
        passportKey,
        passport!,
      );
      let redirectUrl = `${authorizationData.redirect_uri}?code=${authorizationCode}`;
      if (authorizationData.state) {
        redirectUrl += `&state=${authorizationData.state}`;
      }
      response.redirect(redirectUrl);
    }

    const signupUrl = this.combineSignupUrl(PROVIDER.NAVER, passportKey, naver);
    response.redirect(signupUrl);
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

  // @Get('test/kakao')
  // @Redirect()
  // getKakaoTest() {
  //   const kakao_client_id = this.configService.get<string>('KAKAO_CLIENT_ID');
  //   const kakao_redirect_uri =
  //     this.configService.get<string>('KAKAO_REDIRECT_URI');

  //   return {
  //     url: `https://kauth.kakao.com/oauth/authorize?client_id=${kakao_client_id}&redirect_uri=${kakao_redirect_uri}&response_type=code`,
  //   };
  // }

  // @Get('test/naver')
  // @Redirect()
  // getNaverTest() {
  //   const naver_client_id = this.configService.get<string>('NAVER_CLIENT_ID');
  //   const naver_redirect_uri =
  //     this.configService.get<string>('NAVER_REDIRECT_URI');

  //   return {
  //     url: `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${naver_client_id}&state=STATE_STRING&redirect_uri=${naver_redirect_uri}`,
  //   };
  // }
}
