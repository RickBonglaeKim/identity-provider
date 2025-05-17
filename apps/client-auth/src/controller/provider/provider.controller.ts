import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import { Controller, Get, Query, Res, UseInterceptors } from '@nestjs/common';
import { ProviderService } from '../../service/provider/provider.service';
import { Response } from 'express';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('provider')
@UseInterceptors(TransformInterceptor)
export class ProviderController {
  private readonly logger = new Logger(ProviderController.name);

  constructor(
    private readonly providerService: ProviderService,
    private readonly configService: ConfigService,
  ) {}

  @Get('kakao')
  async getKakao(@Query('code') code: string) {
    return await this.providerService.connectKakao(code);
  }

  @Get('naver')
  getNaver() {
    // TODO: 네이버 로그인 구현
    throw new Error('Not implemented');
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
  getKakaoTest(@Res() res: Response) {
    const kakao_client_id = this.configService.get<string>('KAKAO_CLIENT_ID');
    const kakao_redirect_uri =
      this.configService.get<string>('KAKAO_REDIRECT_URI');

    res.redirect(
      `https://kauth.kakao.com/oauth/authorize?client_id=${kakao_client_id}&redirect_uri=${kakao_redirect_uri}&response_type=code`,
    );
  }
}
