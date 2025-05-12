import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import { SigninCreateRequest } from 'dto/interface/sign.in/create/sign.in.create.request.dto';
import {
  Controller,
  UseInterceptors,
  Logger,
  Get,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { SigninService } from '../../service/sign.in/sign.in.service';
import { Response } from 'express';
import { OauthService } from '../../service/oauth/oauth.service';
import { AuthorizeCreateRequest } from 'dto/interface/oauth/authorize/create/authorize.create.request.dto';

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
    @Res() response: Response,
    @Query() dto: SigninCreateRequest,
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

    const passportJson = JSON.parse(passport) as AuthorizeCreateRequest;
    let redirectUrl = `${passportJson.redirect_uri}?code=${authorizationCode}`;
    if (passportJson.state) redirectUrl += `&state=${passportJson.state}`;

    this.logger.debug(`getSignin.redirectUrl -> ${redirectUrl}`);

    response.redirect(HttpStatus.TEMPORARY_REDIRECT, redirectUrl);
    return;
  }
}
