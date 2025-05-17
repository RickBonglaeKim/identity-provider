import { Controller, Get } from '@nestjs/common';

@Controller('verification')
export class VerificationController {
  @Get('phone')
  getVerifyPhone() {}

  @Get('email')
  getVerifyEmail() {}
}
