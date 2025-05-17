import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  Apple,
  Google,
  Kakao,
  KakaoTokenResponse,
  Naver,
  Providers,
  KakaoUserMeResponse,
} from '../../type/service/provider.service.type';

@Injectable()
export class ProviderService {
  private readonly logger = new Logger(ProviderService.name);
  private readonly kakao_client_id: string | undefined;
  private readonly kakao_redirect_uri: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.kakao_client_id = this.configService.get<string>('KAKAO_CLIENT_ID');
    this.kakao_redirect_uri =
      this.configService.get<string>('KAKAO_REDIRECT_URI');
  }

  async connectKakao(code: string): Promise<Kakao> {
    this.logger.debug('connectKakao', code);
    try {
      const tokenData = await this.getToken(code);
      const userInfo = await this.getUserInfo(tokenData.access_token);

      if (!userInfo || !userInfo.id) {
        throw new HttpException('Failed to get user information', 400);
      }

      const kakaoAccount = userInfo.kakao_account;
      const { countryCallingCode, phoneNumber } = this.parsePhoneNumber(
        kakaoAccount.phone_number || '',
      );

      return {
        provider: Providers.Kakao,
        id: userInfo.id.toString(),
        name: kakaoAccount.name || '',
        email: kakaoAccount.email || '',
        phone: {
          countryCallingCode,
          phoneNumber,
        },
      };
    } catch (error: unknown) {
      throw new HttpException(
        '카카오 사용자 정보를 가져오는데 실패했습니다.',
        400,
      );
    }
  }

  private parsePhoneNumber(phoneNumberWithCountryCallingCode: string): {
    countryCallingCode: string;
    phoneNumber: string;
  } {
    if (!phoneNumberWithCountryCallingCode?.trim()) {
      return { countryCallingCode: '+82', phoneNumber: '' };
    }

    const [countryCallingCode, phoneNumber] = phoneNumberWithCountryCallingCode
      .trim()
      .split(' ');

    return {
      countryCallingCode: countryCallingCode || '+82',
      phoneNumber: phoneNumber || '',
    };
  }

  async getToken(code: string): Promise<KakaoTokenResponse> {
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

    const tokenResponse: KakaoTokenResponse = {
      access_token: response.data.access_token,
      token_type: response.data.token_type,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
      scope: response.data.scope,
      refresh_token_expires_in: response.data.refresh_token_expires_in,
    };

    return tokenResponse;
  }
  async getUserInfo(accessToken: string): Promise<KakaoUserMeResponse> {
    const response = await firstValueFrom(
      this.httpService.get<KakaoUserMeResponse>(
        `https://kapi.kakao.com/v2/user/me`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      ),
    );

    if (!response.data) {
      throw new Error('사용자 정보를 가져오는데 실패했습니다.');
    }

    return response.data;
  }

  connectNaver(): Promise<Naver> {
    throw new Error('Not implemented');
  }

  connectGoogle(): Promise<Google> {
    throw new Error('Not implemented');
  }

  connectApple(): Promise<Apple> {
    throw new Error('Not implemented');
  }
}
