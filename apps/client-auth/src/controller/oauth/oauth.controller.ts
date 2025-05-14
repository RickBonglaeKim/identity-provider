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
import { Request, Response } from 'express';
import { AuthorizeCreateRequest } from 'dto/interface/oauth/authorize/create/authorize.create.request.dto';
import { OauthService } from '../../service/oauth/oauth.service';
import { ConfigService } from '@nestjs/config';
import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import { MemberService } from '../../service/member/member.service';
import { ClientService } from '../../service/client/client.service';
import { OauthTokenRequest } from 'dto/interface/oauth/token/request/oauth.token.request.dto';
import { OauthTokenResponse } from 'dto/interface/oauth/token/response/oauth.token.response.dto';

@Controller('oauth')
@UseInterceptors(TransformInterceptor)
export class OauthController {
  private readonly logger = new Logger(OauthController.name);
  private readonly signUrl: string;
  private readonly tokenExpirySeconds: number;
  private readonly refreshTokenExpirySeconds: number;
  private readonly idTokenISS: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OauthService,
    private readonly clientService: ClientService,
    private readonly memberService: MemberService,
  ) {
    this.signUrl = this.configService.getOrThrow<string>('SIGN_URL');
    this.tokenExpirySeconds =
      this.configService.getOrThrow<number>('TOKEN_EXPIRE_IN');
    this.refreshTokenExpirySeconds = this.configService.getOrThrow<number>(
      'REFRESH_TOKEN_EXPIRE_IN',
    );
    this.idTokenISS = this.configService.getOrThrow<string>('ID_TOKEN_ISS');
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
  async getToken(@Body() dto: OauthTokenRequest): Promise<OauthTokenResponse> {
    this.logger.debug(`getToken.dto -> ${JSON.stringify(dto)}`);
    const authorizationData =
      await this.oauthService.findDataInAuthorizationCode(dto.code);
    this.logger.debug(
      `getToken.authorizationData -> ${JSON.stringify(authorizationData)}`,
    );

    if (!authorizationData)
      throw new HttpException(
        'It does not find the data from the authorization code.',
        HttpStatus.UNAUTHORIZED,
      );

    const { client_id, redirect_uri } = authorizationData;
    if (dto.client_id !== client_id)
      throw new HttpException(
        'The client_id of request parameters is incorrect.',
        HttpStatus.UNAUTHORIZED,
      );
    if (dto.redirect_uri !== redirect_uri)
      throw new HttpException(
        'The redirect_uri of request parameters is incorrect.',
        HttpStatus.UNAUTHORIZED,
      );

    const memberId = await this.oauthService.findMemberIdInAuthorizationCode(
      dto.code,
    );

    const memberDetailId =
      await this.oauthService.findMemberDetailIdInAuthorizationCode(dto.code);

    const client = await this.clientService.findClientByClientId(client_id);
    const clientMemberId = await this.memberService.createClientMember(
      client.id,
      memberId,
    );

    const idTokenKeypair = await this.oauthService.findIdTokenKeypair();
    const idToken = await this.oauthService.issueIdToke(
      idTokenKeypair.privateKey,
      client_id,
      this.idTokenISS,
      `${client.id}.${clientMemberId}`,
      Math.floor(Date.now() / 1000) + this.tokenExpirySeconds,
    );
    this.logger.debug(`getToken.idToken -> ${idToken}`);

    const accessToken = await this.oauthService.issueAccessToken(
      memberId,
      memberDetailId,
      clientMemberId,
      authorizationData,
    );
    this.logger.debug(`getToken.accessToken -> ${accessToken}`);
    if (!accessToken)
      throw new HttpException(
        'It fails to issue the access token.',
        HttpStatus.UNAUTHORIZED,
      );

    const refreshToken = await this.oauthService.issueRefreshToken(
      memberId,
      memberDetailId,
      clientMemberId,
      authorizationData,
    );
    this.logger.debug(`getToken.refreshToken -> ${refreshToken}`);
    if (!refreshToken)
      throw new HttpException(
        'It fails to issue the refresh token.',
        HttpStatus.UNAUTHORIZED,
      );

    const deletedResult = await this.oauthService.removeAuthorizationCode(
      dto.code,
    );
    if (!deletedResult)
      throw new HttpException(
        'It fails to remove the authorization code.',
        HttpStatus.UNAUTHORIZED,
      );

    return new OauthTokenResponse(
      accessToken,
      idToken,
      this.tokenExpirySeconds,
      refreshToken,
      this.refreshTokenExpirySeconds,
    );
  }
}
