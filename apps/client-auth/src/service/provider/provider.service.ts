import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  Apple,
  Google,
  Kakao,
  KakaoTokenResponse,
  KakaoUserMeResponse,
  NaverTokenResponse,
  NaverUserMeResponse,
  Naver,
  GoogleTokenResponse,
  GoogleUserMeResponse,
  AppleTokenResponse,
  AppleIdToken,
} from '../../type/service/provider.service.type';
import { PROVIDER } from 'dto/enum/provider.enum';
import { decodeJwt, importPKCS8, SignJWT } from 'jose';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ProviderService {
  private readonly logger = new Logger(ProviderService.name);
  private readonly kakao_client_id: string | undefined;
  private readonly kakao_redirect_uri: string | undefined;
  private readonly naver_client_id: string | undefined;
  private readonly naver_client_secret: string | undefined;
  private readonly naver_redirect_uri: string | undefined;
  private readonly google_client_id: string | undefined;
  private readonly google_client_secret: string | undefined;
  private readonly google_redirect_uri: string | undefined;
  private readonly apple_client_id: string | undefined;
  private readonly apple_redirect_uri: string | undefined;
  private readonly apple_key_id: string | undefined;
  private readonly apple_team_id: string | undefined;
  private readonly apple_private_key_path: string | undefined;
  private readonly appleAuthKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.kakao_client_id = this.configService.get<string>('KAKAO_CLIENT_ID');
    this.kakao_redirect_uri =
      this.configService.get<string>('KAKAO_REDIRECT_URI');
    this.naver_client_id = this.configService.get<string>('NAVER_CLIENT_ID');
    this.naver_client_secret = this.configService.get<string>(
      'NAVER_CLIENT_SECRET',
    );
    this.naver_redirect_uri =
      this.configService.get<string>('NAVER_REDIRECT_URI');
    this.google_client_id = this.configService.get<string>('GOOGLE_CLIENT_ID');
    this.google_client_secret = this.configService.get<string>(
      'GOOGLE_CLIENT_SECRET',
    );
    this.google_redirect_uri = this.configService.get<string>(
      'GOOGLE_REDIRECT_URI',
    );
    this.apple_client_id = this.configService.get<string>('APPLE_CLIENT_ID');
    this.apple_redirect_uri =
      this.configService.get<string>('APPLE_REDIRECT_URI');
    this.apple_key_id = this.configService.get<string>('APPLE_KEY_ID');
    this.apple_team_id = this.configService.get<string>('APPLE_TEAM_ID');
    this.apple_private_key_path = path.join(
      __dirname,
      '../../../cert/AuthKey_C2QLJALWTZ.p8',
    );
    this.appleAuthKey = this.configService.getOrThrow<string>('APPLE_AUTH_KEY');
  }

  async connectKakao(code: string): Promise<Kakao> {
    this.logger.debug('connectKakao', code);
    try {
      const tokenData = await this.getKakaoToken(code);
      const userInfo = await this.getKakaoUserInfo(tokenData.access_token);

      if (!userInfo || !userInfo.id) {
        throw new HttpException('Failed to get user information', 400);
      }

      const kakaoAccount = userInfo.kakao_account;
      const { countryCallingCode, phoneNumber } = this.parsePhoneNumber(
        kakaoAccount.phone_number,
      );
      return {
        provider: PROVIDER.KAKAO,
        id: userInfo.id.toString(),
        name: kakaoAccount.name,
        email: kakaoAccount.email,
        phone: {
          countryCallingCode,
          phoneNumber,
        },
      };
    } catch (error) {
      throw new HttpException(
        '카카오 사용자 정보를 가져오는데 실패했습니다.',
        400,
      );
    }
  }

  async getKakaoToken(code: string): Promise<KakaoTokenResponse> {
    const url = 'https://kauth.kakao.com/oauth/token';
    const body = new URLSearchParams(
      Object.entries({
        grant_type: 'authorization_code',
        client_id: this.kakao_client_id as string,
        redirect_uri: this.kakao_redirect_uri as string,
        code,
      }),
    );

    const response = await firstValueFrom(
      this.httpService.post<KakaoTokenResponse>(url, body.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
    );

    if (!response.data?.access_token) {
      throw new HttpException('Invalid token response', 400);
    }

    return {
      access_token: response.data.access_token || '',
      token_type: response.data.token_type || '',
      refresh_token: response.data.refresh_token || '',
      expires_in: response.data.expires_in || 0,
      scope: response.data.scope || '',
      refresh_token_expires_in: response.data.refresh_token_expires_in || 0,
    };
  }

  async getKakaoUserInfo(token: string): Promise<KakaoUserMeResponse> {
    const url = 'https://kapi.kakao.com/v2/user/me';
    const response = await firstValueFrom(
      this.httpService.get<KakaoUserMeResponse>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    );

    return response.data;
  }

  async connectNaver(code: string): Promise<Naver> {
    try {
      const tokenData = await this.getNaverToken(code);
      const userInfo = await this.getNaverUserInfo(tokenData.access_token);

      const naverAccount = userInfo.response;
      const { countryCallingCode, phoneNumber } = this.parsePhoneNumber(
        naverAccount.mobile_e164,
      );
      return {
        provider: PROVIDER.NAVER,
        id: naverAccount.id,
        name: naverAccount.name,
        email: naverAccount.email,
        phone: {
          countryCallingCode,
          phoneNumber,
        },
      };
    } catch (error) {
      this.logger.error('Error in connectNaver', error);
      throw new HttpException(
        'Failed to connect with Naver',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getNaverToken(code: string): Promise<NaverTokenResponse> {
    const url = 'https://nid.naver.com/oauth2.0/token';
    const body = new URLSearchParams(
      Object.entries({
        grant_type: 'authorization_code',
        client_id: this.naver_client_id as string,
        client_secret: this.naver_client_secret as string,
        redirect_uri: this.naver_redirect_uri as string,
        code,
      }),
    );

    const response = await firstValueFrom(
      this.httpService.post<NaverTokenResponse>(url, body.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
    );

    if (!response.data?.access_token) {
      throw new HttpException('Invalid token response', 400);
    }

    return {
      access_token: response.data.access_token || '',
      token_type: response.data.token_type || '',
      refresh_token: response.data.refresh_token || '',
      expires_in: response.data.expires_in || 0,
      scope: response.data.scope || '',
      refresh_token_expires_in: response.data.refresh_token_expires_in || 0,
    };
  }

  async getNaverUserInfo(token: string): Promise<NaverUserMeResponse> {
    const url = 'https://openapi.naver.com/v1/nid/me';
    const response = await firstValueFrom(
      this.httpService.get<NaverUserMeResponse>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    );
    return response.data;
  }

  async connectGoogle(code: string): Promise<Google> {
    this.logger.debug('connectGoogle', code);
    try {
      const tokenData = await this.getGoogleToken(code);
      const userInfo = await this.getGoogleUserInfo(tokenData.access_token);

      return {
        provider: PROVIDER.GOOGLE,
        id: userInfo.sub,
        name: userInfo.given_name,
        email: userInfo.email,
        phone: {
          countryCallingCode: '',
          phoneNumber: '',
        },
      };
    } catch (error) {
      this.logger.error('Error in connectGoogle');
      throw new HttpException(
        'Failed to connect with Google',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getGoogleToken(code: string): Promise<GoogleTokenResponse> {
    const url = 'https://oauth2.googleapis.com/token';
    const body = new URLSearchParams(
      Object.entries({
        grant_type: 'authorization_code',
        client_id: this.google_client_id as string,
        client_secret: this.google_client_secret as string,
        redirect_uri: this.google_redirect_uri as string,
        code,
      }),
    );
    this.logger.log(`getGoogleToken`, body.toString());
    const response = await firstValueFrom(
      this.httpService.post<GoogleTokenResponse>(url, body.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
    );

    return response.data;
  }

  async getGoogleUserInfo(token: string): Promise<GoogleUserMeResponse> {
    const url = 'https://www.googleapis.com/oauth2/v3/userinfo';
    const response = await firstValueFrom(
      this.httpService.get<GoogleUserMeResponse>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    );
    console.log(`google`, response.data);

    return response.data;
  }

  async connectApple(code: string): Promise<Apple> {
    this.logger.debug('connectApple', code);
    try {
      const tokenData = await this.getAppleToken(code);
      console.log(tokenData);
      const decodedIdToken = decodeJwt(tokenData.id_token) as AppleIdToken;
      this.logger.debug(
        `connectApple.decodedIdToken`,
        JSON.stringify(decodedIdToken),
      );
      return {
        provider: PROVIDER.APPLE,
        id: decodedIdToken.sub,
        email: decodedIdToken.email,
        phone: undefined,
      };
    } catch (error) {
      this.logger.error('Error in connectApple');
      throw new HttpException(
        'Failed to connect with Apple',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAppleToken(code: string): Promise<AppleTokenResponse> {
    const url = 'https://appleid.apple.com/auth/token';
    const body = new URLSearchParams(
      Object.entries({
        grant_type: 'authorization_code',
        client_id: this.apple_client_id as string,
        client_secret: await this.createClientSecret(),
        redirect_uri: this.apple_redirect_uri as string,
        code,
      }),
    );
    this.logger.log(`getAppleToken`, body.toString());
    const response = await firstValueFrom(
      this.httpService.post<AppleTokenResponse>(url, body.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
    );

    if (!response.data?.access_token) {
      throw new HttpException('Invalid token response', 400);
    }
    this.logger.log(`getAppleToken`, response.data);
    return {
      access_token: response.data.access_token || '',
      token_type: response.data.token_type || '',
      refresh_token: response.data.refresh_token || '',
      expires_in: response.data.expires_in || 0,
      scope: response.data.scope || '',
      refresh_token_expires_in: response.data.refresh_token_expires_in || 0,
      id_token: response.data.id_token || '',
    } as AppleTokenResponse;
  }

  private async createClientSecret(): Promise<string> {
    // if (
    //   !this.apple_private_key_path ||
    //   !this.apple_key_id ||
    //   !this.apple_team_id ||
    //   !this.apple_client_id
    // ) {
    //   throw new HttpException(
    //     'Apple configuration is missing',
    //     HttpStatus.INTERNAL_SERVER_ERROR,
    //   );
    // }
    // this.logger.debug(
    //   `createClientSecret.apple_private_key_path -> ${this.apple_private_key_path}`,
    // );

    this.logger.debug(
      `createClientSecret.appleAuthKey -> ${path.resolve('cert', this.appleAuthKey)}`,
    );

    try {
      const keyContent = await fs.promises.readFile(
        path.resolve('cert', this.appleAuthKey),
        'utf-8',
      );
      this.logger.debug(`createClientSecret.keyContent -> ${keyContent}`);
      const privateKey = await importPKCS8(keyContent, 'ES256');
      const now = Math.floor(Date.now() / 1000);
      const jwt = await new SignJWT({})
        .setProtectedHeader({ alg: 'ES256', kid: this.apple_key_id })
        .setIssuer(this.apple_team_id!)
        .setAudience('https://appleid.apple.com')
        .setSubject(this.apple_client_id!)
        .setIssuedAt(now)
        .setExpirationTime(now + 60 * 60 * 6) // 6시간
        .sign(privateKey);

      return jwt;
    } catch (error) {
      this.logger.error('Failed to create client secret', error);
      throw new HttpException(
        'Failed to create client secret',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private parsePhoneNumber(phoneNumberRaw: string) {
    const COUNTRY_CODES = [82];
    const countryCallingCode = COUNTRY_CODES.find((code) =>
      phoneNumberRaw.startsWith(`+${code}`),
    );
    const phoneNumber = phoneNumberRaw.replace(`+${countryCallingCode}`, '');
    return {
      countryCallingCode: countryCallingCode?.toString().trim() || '',
      phoneNumber: phoneNumber.trim(),
    };
  }
}
