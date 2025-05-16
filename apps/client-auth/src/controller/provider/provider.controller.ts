import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('provider')
@UseInterceptors(TransformInterceptor)
export class ProviderController {
  constructor(private readonly configService: ConfigService) {}

  @Get('test/kakao')
  async getTestKakao() {}

  @Get('test/naver')
  async getTestNaver() {}

  @Get('test/google')
  async getTestGoogle() {}

  @Get('test/apple')
  async getTestApple() {}

  @Get('callback/kakao')
  async getCallbackKakao() {}

  @Get('callback/naver')
  async getCallbackNaver() {}

  @Get('callback/google')
  async getCallbackGoogle() {}

  @Get('callback/apple')
  async getCallbackApple() {}
}
