import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import {
  Controller,
  Get,
  Query,
  Redirect,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { ProviderService } from '../../service/provider/provider.service';

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('provider')
export class ProviderController {
  private readonly logger = new Logger(ProviderController.name);

  constructor(
    private readonly providerService: ProviderService,
    private readonly configService: ConfigService,
  ) {}

  @UseInterceptors(TransformInterceptor)
  @Get('kakao')
  async getKakao(@Query('code') code: string) {
    this.logger.debug('getKakao', code);
    return await this.providerService.connectKakao(code);
  }

  @UseInterceptors(TransformInterceptor)
  @Get('naver')
  getNaver(@Query('code') code: string) {
    this.logger.debug('getNaver', code);
    return this.providerService.connectNaver(code);
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

  @Get('test/kakao')
  @Redirect()
  getKakaoTest() {
    const kakao_client_id = this.configService.get<string>('KAKAO_CLIENT_ID');
    const kakao_redirect_uri =
      this.configService.get<string>('KAKAO_REDIRECT_URI');

    return {
      url: `https://kauth.kakao.com/oauth/authorize?client_id=${kakao_client_id}&redirect_uri=${kakao_redirect_uri}&response_type=code`,
    };
  }

  @Get('test/naver')
  @Redirect()
  getNaverTest() {
    const naver_client_id = this.configService.get<string>('NAVER_CLIENT_ID');
    const naver_redirect_uri =
      this.configService.get<string>('NAVER_REDIRECT_URI');

    return {
      url: `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${naver_client_id}&state=STATE_STRING&redirect_uri=${naver_redirect_uri}`,
    };
  }
}
