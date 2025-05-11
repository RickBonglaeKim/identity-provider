import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import { SigninCreateRequest } from 'dto/interface/sign.in/sign.in.create.request.dto';
import {
  Controller,
  UseInterceptors,
  Logger,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { SigninService } from '../../service/sign.in/sign.in.service';
import { Response } from 'express';
import { OauthService } from '../../service/oauth/oauth.service';

@Controller('signin')
@UseInterceptors(TransformInterceptor)
export class SignInController {
  private readonly logger = new Logger(SignInController.name);

  constructor(
    private readonly signinService: SigninService,
    private readonly oauthService: OauthService,
  ) {}

  @Get()
  async getSignin(
    @Res({ passthrough: true }) response: Response,
    @Query() dto: SigninCreateRequest,
  ): Promise<void> {
    const passport = await this.oauthService.findPassport(dto.passport);
    if (!passport) {
      response.status(251);
      return;
    }
    const isAuthorized = await this.signinService.findMember(
      dto.email,
      dto.password,
    );
    this.logger.debug(`getSignin.isAuthorized -> ${isAuthorized}`);
    if (!isAuthorized) {
      response.status(252);
      return;
    }
  }
}
