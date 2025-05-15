import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('provider')
@UseInterceptors(TransformInterceptor)
export class ProviderController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  async getKakao() {}

  @Get()
  async getNaver() {}

  @Get()
  async getGoogle() {}

  @Get()
  async getApple() {}
}
