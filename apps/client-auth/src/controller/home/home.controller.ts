import { Controller, Get, HttpCode } from '@nestjs/common';

@Controller('/')
export class HomeController {
  @Get('/alive')
  @HttpCode(200)
  get(): void {}
}
