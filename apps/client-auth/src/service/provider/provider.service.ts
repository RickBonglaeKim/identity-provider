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
} from '../../type/service/provider.service.type';
import { PROVIDER } from 'dto/enum/provider.enum';

@Injectable()
export class ProviderService {
  private readonly logger = new Logger(ProviderService.name);
  private readonly kakao_client_id: string | undefined;
  private readonly kakao_redirect_uri: string | undefined;
  private readonly naver_client_id: string | undefined;
  private readonly naver_client_secret: string | undefined;
  private readonly naver_redirect_uri: string | undefined;

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
    console.log(`naver`, response.data);

    return response.data;
  }

  connectGoogle(): Promise<Google> {
    throw new Error('Not implemented');
  }

  connectApple(): Promise<Apple> {
    throw new Error('Not implemented');
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
