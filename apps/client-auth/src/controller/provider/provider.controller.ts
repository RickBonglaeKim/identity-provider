import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ProviderService } from '../../service/provider/provider.service';
import { Response, Request } from 'express';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OauthInternalError } from '../../type/service/oauth.service.type';
import { SignInService } from '../../service/sign.in/sign.in.service';
import { PROVIDER, Providers } from 'dto/enum/provider.enum';
import {
  AppleCallback,
  ProviderData,
} from '../../type/service/provider.service.type';
import makeMemberProviderKey from '../../util/make.ProviderPassword';
import trimPhoneNumber from '../../util/trim.phoneNumber';
import * as cryptoJS from 'crypto-js';
import { SignMember } from '../../type/service/sign.service.type';
import { COOKIE_NAME } from '../../enum/cookie.name.enum';
import { CookieHandler } from '../../util/cookie.handler';

@Controller('provider')
export class ProviderController {
  private readonly logger = new Logger(ProviderController.name);
  private readonly signUrl: string;
  private readonly memberKeyEncryptionKey: string;

  constructor(
    private readonly providerService: ProviderService,
    private readonly configService: ConfigService,
    private readonly signInService: SignInService,
    private readonly cookieHandler: CookieHandler,
  ) {
    this.signUrl = this.configService.getOrThrow<string>('SIGN_URL');
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
    let url = this.cookieHandler.getRedirectCookie(request);
    this.logger.debug(`combineRedirectUrlWithError.url -> ${url}`);
    if (!url) {
      url = this.signUrl;
    }
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
    let signUpUrl = `${this.signUrl}?provider=${providerId}&passport=${passportKey}&memberProviderKey=${memberProviderKey}`;
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
    provider: Providers,
  ): string {
    const memberKey = cryptoJS.AES.encrypt(
      JSON.stringify({
        memberId: signMember.memberId,
        memberDetailId: signMember.memberDetailId,
        passportKey: passportKey,
        timestamp: Date.now(),
        provider: provider,
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
      return;
    }

    const provider = PROVIDER.KAKAO;
    let signInUrl = `${this.signUrl}?provider=${provider}`;

    const signInErrorUrl = this.combineAuthorizationErrorUrl(
      signInUrl,
      code,
      state,
    );
    if (signInErrorUrl) {
      response.redirect(HttpStatus.FOUND, signInErrorUrl);
      return;
    }

    const passportKey = state!;
    signInUrl += `&passport=${passportKey}`;

    const kakao = await this.providerService.connectKakao(code!);
    if (!kakao) {
      response.redirect(
        HttpStatus.FOUND,
        this.combineErrorUrl(signInUrl, 'invalid_kakao'),
      );
      return;
    }

    const member = await this.signInService.findMemberByMemberProvider(
      makeMemberProviderKey(provider, kakao.id),
    );

    if (member) {
      response.redirect(
        HttpStatus.FOUND,
        this.generateSignInUrl(member, passportKey, provider),
      );
      return;
    }

    // The member searched by the Kakao does not exist in the database.
    response.redirect(
      HttpStatus.FOUND,
      this.combineSignUpUrl(provider, passportKey, kakao),
    );
    return;
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
      return;
    }

    const provider = PROVIDER.NAVER;
    let signInUrl = `${this.signUrl}?provider=${provider}`;

    const signInErrorUrl = this.combineAuthorizationErrorUrl(
      signInUrl,
      code,
      state,
    );
    if (signInErrorUrl) {
      response.redirect(HttpStatus.FOUND, signInErrorUrl);
      return;
    }

    const passportKey = state!;
    signInUrl += `&passport=${passportKey}`;

    const naver = await this.providerService.connectNaver(code!);
    if (!naver) {
      response.redirect(
        HttpStatus.FOUND,
        this.combineErrorUrl(signInUrl, 'invalid_naver'),
      );
      return;
    }

    const member = await this.signInService.findMemberByMemberProvider(
      makeMemberProviderKey(provider, naver.id),
    );

    if (member) {
      response.redirect(
        HttpStatus.FOUND,
        this.generateSignInUrl(member, passportKey, provider),
      );
      return;
    }

    // The member searched by the Naver does not exist in the database.
    response.redirect(
      HttpStatus.FOUND,
      this.combineSignUpUrl(provider, passportKey, naver),
    );
    return;
  }

  @Get('google')
  async getGoogle(
    @Req() request: Request,
    @Res() response: Response,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
    @Query('error_description') error_description?: string,
  ): Promise<void> {
    this.logger.debug(
      `getGoogle.code -> ${code}`,
      `getGoogle.state -> ${state}`,
      `getGoogle.error -> ${error}`,
      `getGoogle.error_description -> ${error_description}`,
    );

    if (error) {
      response.redirect(
        this.combineRedirectUrlWithError(request, error, error_description),
      );
      return;
    }

    const provider = PROVIDER.GOOGLE;
    let signInUrl = `${this.signUrl}?provider=${provider}`;

    const signInErrorUrl = this.combineAuthorizationErrorUrl(
      signInUrl,
      code,
      state,
    );
    if (signInErrorUrl) {
      response.redirect(HttpStatus.FOUND, signInErrorUrl);
      return;
    }

    const passportKey = state!;
    signInUrl += `&passport=${passportKey}`;

    const google = await this.providerService.connectGoogle(code!);
    if (!google) {
      response.redirect(
        HttpStatus.FOUND,
        this.combineErrorUrl(signInUrl, 'invalid_google'),
      );
      return;
    }

    const member = await this.signInService.findMemberByMemberProvider(
      makeMemberProviderKey(provider, google.id),
    );

    if (member) {
      response.redirect(
        HttpStatus.FOUND,
        this.generateSignInUrl(member, passportKey, provider),
      );
      return;
    }

    // The member searched by the Google does not exist in the database.
    response.redirect(
      HttpStatus.FOUND,
      this.combineSignUpUrl(provider, passportKey, google),
    );
    return;
  }

  @Post('apple')
  async getApple(
    @Req() request: Request,
    @Res() response: Response,
    @Body() data: AppleCallback,
  ): Promise<void> {
    this.logger.debug(`getApple.data -> ${JSON.stringify(data)}`);

    if (data.error) {
      response.redirect(
        HttpStatus.FOUND,
        this.combineRedirectUrlWithError(
          request,
          data.error,
          data.error_description,
        ),
      );
      return;
    }

    const provider = PROVIDER.APPLE;
    let signInUrl = `${this.signUrl}?provider=${provider}`;

    const signInErrorUrl = this.combineAuthorizationErrorUrl(
      signInUrl,
      data.code,
      data.state,
    );
    if (signInErrorUrl) {
      response.redirect(HttpStatus.FOUND, signInErrorUrl);
      return;
    }

    const passportKey = data.state;
    signInUrl += `&passport=${passportKey}`;

    const apple = await this.providerService.connectApple(data.code!);
    if (!apple) {
      response.redirect(
        HttpStatus.FOUND,
        this.combineErrorUrl(signInUrl, 'invalid_apple'),
      );
      return;
    }

    this.logger.debug(`getApple.apple -> ${JSON.stringify(apple)}`);

    const member = await this.signInService.findMemberByMemberProvider(
      makeMemberProviderKey(provider, apple.id),
    );

    if (member) {
      response.redirect(
        HttpStatus.FOUND,
        this.generateSignInUrl(member, passportKey, provider),
      );
      return;
    }

    // The member searched by the Apple does not exist in the database.
    response.redirect(
      HttpStatus.FOUND,
      this.combineSignUpUrl(provider, passportKey, apple),
    );
    return;
  }
}
