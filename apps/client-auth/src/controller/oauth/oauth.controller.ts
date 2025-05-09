import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  Query,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthorizeCreateRequest } from 'dto/interface/oauth/authorize/create/authorize.create.request.dto';
import { OauthService } from '../../service/oauth/oauth.service';
import { ConfigService } from '@nestjs/config';

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
    @Res({ passthrough: true }) response: Response,
    @Query() dto: AuthorizeCreateRequest,
  ): Promise<void> {
    const redirectClient = this.oauthService.createRedirectUri(
      dto.redirect_uri,
    )(null);
    const verifiedResult =
      await this.oauthService.verifyClientByClientIdAndClientSecret(
        dto.client_id,
        dto.client_secret,
        dto.redirect_uri,
      );
    if (!verifiedResult)
      response.redirect(
        HttpStatus.TEMPORARY_REDIRECT,
        redirectClient('invalid_request')('Request parameters is incorrect.')(
          null,
        ),
      );
  }
}
