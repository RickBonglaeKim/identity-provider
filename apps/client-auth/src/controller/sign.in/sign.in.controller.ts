import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import { SigninRequestCreate } from 'dto/interface/sign.in/request/sign.in.request.create.dto';
import {
  Controller,
  UseInterceptors,
  Logger,
  Res,
  HttpStatus,
  Post,
  Body,
} from '@nestjs/common';
import { SigninService } from '../../service/sign.in/sign.in.service';
import { Response } from 'express';
import { OauthService } from '../../service/oauth/oauth.service';
import { OauthAuthorizeRequestCreate } from 'dto/interface/oauth/authorize/request/oauth.authorize.request.create.dto';

@Controller('signin')
export class SignInController {
  private readonly logger = new Logger(SignInController.name);

  constructor(
    private readonly signinService: SigninService,
    private readonly oauthService: OauthService,
  ) {}

  @Post()
  async postSignin(
    @Res() response: Response,
    @Body() dto: SigninRequestCreate,
  ): Promise<void> {
    const passport = await this.oauthService.findPassport(dto.passport);
    if (!passport) {
      response.status(251);
      return;
    }

    const member = await this.signinService.findMember(dto.email, dto.password);
    this.logger.debug(`getSignin.memberId -> ${JSON.stringify(member)}`);
    if (!member) {
      response.status(252);
      return;
    }

    const authorizationCode = await this.oauthService.createAuthorizationCode(
      member.memberId,
      member.memberDetailId,
      dto.passport,
      passport,
    );

    if (!authorizationCode) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR);
      return;
    }

    // set cookie

    const passportJson = JSON.parse(passport) as OauthAuthorizeRequestCreate;
    let redirectUrl = `${passportJson.redirect_uri}?code=${authorizationCode}`;
    if (passportJson.state) redirectUrl += `&state=${passportJson.state}`;

    this.logger.debug(`getSignin.redirectUrl -> ${redirectUrl}`);

    response.redirect(redirectUrl);
  }
}
