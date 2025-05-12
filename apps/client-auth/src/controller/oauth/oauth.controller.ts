import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Query,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import * as jose from 'jose';
import { Request, Response } from 'express';
import { AuthorizeCreateRequest } from 'dto/interface/oauth/authorize/create/authorize.create.request.dto';
import { OauthService } from '../../service/oauth/oauth.service';
import { ConfigService } from '@nestjs/config';
import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import { TokenCreateRequest } from 'dto/interface/oauth/token/create/token.create.request.dto';

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

  @Post('token')
  async getToken(@Body() dto: TokenCreateRequest): Promise<void> {
    this.logger.debug(`getToken.dto -> ${JSON.stringify(dto)}`);
    const authorizationDataResult =
      await this.oauthService.findDataInAuthorizationCode(dto.code);
    this.logger.debug(
      `getToken.authorizationDataResult -> ${JSON.stringify(authorizationDataResult)}`,
    );
    if (!authorizationDataResult)
      throw new HttpException(
        'It does not find the data in authorization code.',
        HttpStatus.UNAUTHORIZED,
      );
    if (dto.client_id !== authorizationDataResult.client_id)
      throw new HttpException(
        'The client_id of request parameters is incorrect.',
        HttpStatus.UNAUTHORIZED,
      );
    if (dto.client_secret !== authorizationDataResult.client_secret)
      throw new HttpException(
        'The client_secret of request parameters is incorrect.',
        HttpStatus.UNAUTHORIZED,
      );
    if (dto.redirect_uri !== authorizationDataResult.redirect_uri)
      throw new HttpException(
        'The redirect_uri of request parameters is incorrect.',
        HttpStatus.UNAUTHORIZED,
      );

    const idTokenKeypair = await this.oauthService.findIdTokenKeypair();
    await this.oauthService.issueIdToke(idTokenKeypair.privateKey);
  }
}
