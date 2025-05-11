import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  Query,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthorizeCreateRequest } from 'dto/interface/oauth/authorize/create/authorize.create.request.dto';
import { OauthService } from '../../service/oauth/oauth.service';
import { ConfigService } from '@nestjs/config';
import { TransformInterceptor } from '@app/interceptor/transform.interceptor';

@Controller('oauth')
@UseInterceptors(TransformInterceptor)
export class OauthController {
  private readonly logger = new Logger(OauthController.name);
  private readonly signUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OauthService,
  ) {
    this.signUrl = this.configService.getOrThrow<string>('SIGN_URL');
  }

  @Get('authorize')
  async getAuthorize(
    @Res() response: Response,
    @Query() dto: AuthorizeCreateRequest,
  ): Promise<void> {
    const redirectClient = this.oauthService.createRedirectUri(
      dto.redirect_uri,
    )(null);
    const verifiedResult = await this.oauthService.verifyClient(
      dto.client_id,
      dto.client_secret,
      dto.redirect_uri,
    );

    if (verifiedResult) {
      const passport = await this.oauthService.createPassport(dto);
      if (!passport)
        redirectClient('server_error')('It fails to generate passport.')(null);
      response.redirect(`${this.signUrl}?passport=${passport}`);
    } else {
      const redirectUri = redirectClient('invalid_request')(
        'Request parameters are incorrect.',
      )(null);
      this.logger.debug(`verifiedResult: ${verifiedResult} -> ${redirectUri}`);
      response.redirect(HttpStatus.TEMPORARY_REDIRECT, redirectUri);
    }
  }

  @Get('token')
  async getToken() {}
}
