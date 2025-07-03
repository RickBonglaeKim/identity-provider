import { Controller, Get, Logger, Res, Query, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { SignGuard } from '../../guard/sign.guard';
import { SignInfo } from '../../decorator/sign.decorator';
import { SignCookie } from '../../type/service/sign.service.type';
import { ConfigService } from '@nestjs/config';
import { SignOutService } from '../../service/sign.out/sign.out.service';

@Controller('signout')
export class SignOutController {
  private readonly logger = new Logger(SignOutController.name);
  private readonly signUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly signOutService: SignOutService,
  ) {
    this.signUrl = this.configService.getOrThrow<string>('SIGN_URL');
  }

  @Get()
  @UseGuards(SignGuard)
  getSignout(
    @Res() response: Response,
    @Query('return') returnUrl: string,
  ): void {
    this.signOutService.signOut(response);

    if (returnUrl) response.redirect(returnUrl);
    response.redirect(this.signUrl);
  }
}
