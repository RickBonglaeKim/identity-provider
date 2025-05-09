import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as CryptoJS from 'crypto-js';
import * as jose from 'jose';
import { AuthorizeCreateRequest } from 'dto/interface/oauth/authorize/create/authorize.create.request.dto';
import { OauthService } from '../../service/oauth/oauth.service';
import { ConfigService } from '@nestjs/config';

@Controller('oauth')
export class OauthController {
  private readonly logger = new Logger(OauthController.name);
  private readonly signUrl: string;
  private readonly passportTokenSecret: string;
  private readonly passportCryptoSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OauthService,
  ) {
    this.signUrl = this.configService.getOrThrow<string>('SIGN_URL');
    this.passportCryptoSecret = this.configService.getOrThrow<string>(
      'PASSPORT_CRYPTO_SECRET',
    );
    this.passportTokenSecret = this.configService.getOrThrow<string>(
      'PASSPORT_TOKEN_SECRET',
    );
  }

  @Get('authorize')
  async getAuthorize(
    @Req() request: Request,
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

    if (!verifiedResult) {
      const redirectUri = redirectClient('invalid_request')(
        'Request parameters are incorrect.',
      )(null);
      this.logger.debug(`verifiedResult: ${verifiedResult} -> ${redirectUri}`);
      response.redirect(HttpStatus.TEMPORARY_REDIRECT, redirectUri);
    }
  }
}
