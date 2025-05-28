import { Controller, Get, Query, Redirect, Req, Res } from '@nestjs/common';
import { ProviderService } from '../../service/provider/provider.service';
import { Response, Request } from 'express';
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
import makeMemberProviderKey from '../../util/make.ProviderPassword';
import trimPhoneNumber from '../../util/trim.phoneNumber';

@Controller('provider')
export class ProviderController {
  private readonly logger = new Logger(ProviderController.name);
  private readonly signinUrl: string;
  private readonly signupUrl: string;
  private readonly redirectCookieName: string;

  constructor(
    private readonly providerService: ProviderService,
    private readonly configService: ConfigService,
    private readonly oauthService: OauthService,
    private readonly signinService: SigninService,
  ) {
    this.signinUrl = this.configService.getOrThrow<string>('SIGN_IN_URL');
    this.signupUrl = this.configService.getOrThrow<string>('SIGN_UP_URL');
    this.redirectCookieName = this.configService.getOrThrow<string>(
      'REDIRECT_COOKIE_NAME',
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

  private combineSignupUrl(
    providerId: Providers,
    passportKey: string,
    providerData: ProviderData,
  ): string {
    const memberProviderKey = makeMemberProviderKey(
      providerId,
      providerData.id,
    );
    let signupUrl = `${this.signupUrl}?provider=${providerId}&passport=${passportKey}&memberProviderKey=${memberProviderKey}`;
    if (providerData.name) signupUrl += `&name=${providerData.name}`;
    if (providerData.email) signupUrl += `&email=${providerData.email}`;
    if (providerData.phone) {
      signupUrl += `&countryCallingCode=${providerData.phone.countryCallingCode}`;
      signupUrl += `&phoneNumber=${trimPhoneNumber(providerData.phone.phoneNumber)}`;
    }
    return signupUrl;
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

    let signinUrl = `${this.signinUrl}?provider=${PROVIDER.KAKAO}`;

    const signinErrorUrl = this.combineAuthorizationErrorUrl(
      signinUrl,
      code,
      state,
    );
    if (signinErrorUrl) response.redirect(signinErrorUrl);

    const passportKey = state!;

    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      response.redirect(this.combineErrorUrl(signinUrl, 'invalid_passport'));
    }
    signinUrl += `&passport=${passport}`;
    const authorizationData = JSON.parse(
      passport!,
    ) as OauthAuthorizeRequestCreate;

    const kakao = await this.providerService.connectKakao(code!);
    if (!kakao) {
      response.redirect(this.combineErrorUrl(signinUrl, 'invalid_kakao'));
    }

    const member = await this.signinService.findMemberByMemberProvider(
      makeMemberProviderKey(PROVIDER.KAKAO, kakao.id),
    );
    if (member) {
      const authorizationCode = await this.oauthService.createAuthorizationCode(
        member.memberId,
        member.memberDetailId,
        passportKey,
        passport!,
      );
      response.redirect(
        this.combineRedirectUrl(
          authorizationData.redirect_uri,
          authorizationCode!,
          authorizationData.state,
        ),
      );
    }

    // The member searched by the Kakao does not exist in the database.
    response.redirect(
      this.combineSignupUrl(PROVIDER.KAKAO, passportKey, kakao),
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

    let signinUrl = `${this.signinUrl}?provider=${PROVIDER.NAVER}`;

    const signinErrorUrl = this.combineAuthorizationErrorUrl(
      signinUrl,
      code,
      state,
    );
    if (signinErrorUrl) response.redirect(signinErrorUrl);

    const passportKey = state!;

    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      response.redirect(this.combineErrorUrl(signinUrl, 'invalid_passport'));
    }
    signinUrl += `&passport=${passport}`;
    const authorizationData = JSON.parse(
      passport!,
    ) as OauthAuthorizeRequestCreate;

    const naver = await this.providerService.connectNaver(code!);
    if (!naver) {
      response.redirect(this.combineErrorUrl(signinUrl, 'invalid_naver'));
    }

    const member = await this.signinService.findMemberByMemberProvider(
      makeMemberProviderKey(PROVIDER.NAVER, naver.id),
    );
    if (member) {
      const authorizationCode = await this.oauthService.createAuthorizationCode(
        member.memberId,
        member.memberDetailId,
        passportKey,
        passport!,
      );
      response.redirect(
        this.combineRedirectUrl(
          authorizationData.redirect_uri,
          authorizationCode!,
          authorizationData.state,
        ),
      );
    }

    // The member searched by the Naver does not exist in the database.
    response.redirect(
      this.combineSignupUrl(PROVIDER.NAVER, passportKey, naver),
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
