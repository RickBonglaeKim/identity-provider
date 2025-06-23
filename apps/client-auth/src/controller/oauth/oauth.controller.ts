import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { OauthAuthorizeRequestCreate } from 'dto/interface/oauth/authorize/request/oauth.authorize.request.create.dto';
import { OauthService } from '../../service/oauth/oauth.service';
import { ConfigService } from '@nestjs/config';
import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import { MemberService } from '../../service/member/member.service';
import { ClientService } from '../../service/client/client.service';
import { OauthTokenRequestCreate } from 'dto/interface/oauth/token/request/oauth.token.request.create.dto';
import { OauthTokenResponse } from 'dto/interface/oauth/token/response/oauth.token.response.dto';
import { ChildService } from '../../service/child/child.service';

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
    private readonly childService: ChildService,
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
    @Query() dto: OauthAuthorizeRequestCreate,
  ): Promise<void> {
    const redirectClient = this.oauthService.createRedirectUri(
      dto.redirect_uri,
    )(null);
    const verifiedResult = await this.oauthService.verifyClient(
      dto.client_id,
      dto.redirect_uri,
    );
    this.logger.debug(
      `getAuthorize.verifiedResult -> ${JSON.stringify(verifiedResult)}`,
    );

    if (verifiedResult.isVerified) {
      const passport = await this.oauthService.createPassport(dto);
      this.logger.debug(`getAuthorize.passport -> ${!passport}`);

      if (!passport) {
        redirectClient('server_error')('It fails to generate passport.')(null);
      }

      let url = `${this.signUrl}?passport=${passport}&client=${verifiedResult.signCode}`;
      if (dto.service_url) {
        url += `&service_url=${dto.service_url}`;
      }
      this.logger.debug(`getAuthorize.url -> ${url}`);
      response.redirect(HttpStatus.TEMPORARY_REDIRECT, url);
    } else {
      const redirectUri = redirectClient('invalid_request')(
        'Request parameters are incorrect.',
      )(null);
      this.logger.debug(`getAuthorize.redirectUri -> ${redirectUri}`);
      response.redirect(HttpStatus.TEMPORARY_REDIRECT, redirectUri);
    }
  }

  @Post('token')
  async postToken(
    @Body() dto: OauthTokenRequestCreate,
  ): Promise<OauthTokenResponse> {
    this.logger.debug(`postToken.dto -> ${JSON.stringify(dto)}`);
    const authorizationData =
      await this.oauthService.findDataInAuthorizationCode(dto.code);
    this.logger.debug(
      `postToken.authorizationData -> ${JSON.stringify(authorizationData)}`,
    );
    if (!authorizationData) {
      throw new HttpException(
        'It does not find the data from the authorization code.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const { client_id, redirect_uri, scope } = authorizationData;
    if (dto.client_id !== client_id) {
      throw new HttpException(
        'The client_id of request parameters is incorrect.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (dto.redirect_uri !== redirect_uri) {
      throw new HttpException(
        'The redirect_uri of request parameters is incorrect.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const memberResult = await Promise.all([
      this.oauthService.findMemberIdInAuthorizationCode(dto.code),
      this.oauthService.findMemberDetailIdInAuthorizationCode(dto.code),
    ]).catch((error) => {
      this.logger.error(error);
      throw new HttpException(
        'It can not find member form the cache.',
        HttpStatus.UNAUTHORIZED,
      );
    });
    const memberId = memberResult[0];
    const memberDetailId = memberResult[1];

    const existAuthorizationTokenResult =
      await this.oauthService.existAuthorizationToken(memberId, memberDetailId);
    if (existAuthorizationTokenResult) {
      const removeAuthorizationTokenResult =
        await this.oauthService.removeAuthorizationToken(
          memberId,
          memberDetailId,
        );
      if (!removeAuthorizationTokenResult) {
        throw new HttpException(
          'It fails to remove the existing authorization token.',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    const client = await this.clientService.findClientByClientId(client_id);
    const clientMemberId = await this.memberService.createClientMember(
      client.id,
      memberId,
    );

    const clientMemberIdResult = await this.oauthService.createClientMemberId(
      memberId,
      memberDetailId,
      clientMemberId,
    );
    this.logger.debug(
      `postToken.clientMemberIdResult -> ${clientMemberIdResult}`,
    );
    if (!clientMemberIdResult) {
      throw new HttpException(
        'It fails to create the client member id.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const memberGroupResult = await Promise.all([
      this.memberService.findMemberDetailById(memberDetailId),
      this.memberService.findMemberPhoneByMemberId(memberId),
      this.childService.findChildByMemberId(memberId),
    ]).catch((error) => {
      this.logger.error(error);
      throw new HttpException(
        'It fails to take the member information.',
        HttpStatus.UNAUTHORIZED,
      );
    });
    const idTokenPayload = this.oauthService.createIdTokenPayloadByScope(
      memberGroupResult,
      scope,
    );

    const idTokenKeypair = await this.oauthService.findIdTokenKeypair();
    const idToken = await this.oauthService.issueIdToken(
      memberId,
      memberDetailId,
      idTokenKeypair.privateKey,
      client_id,
      this.idTokenISS,
      `${client.id}.${clientMemberId}`,
      Math.floor(Date.now() / 1000) + this.tokenExpirySeconds,
      idTokenPayload,
    );
    this.logger.debug(`postToken.idToken -> ${idToken}`);
    if (!idToken) {
      throw new HttpException(
        'It fails to issue the id token.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const accessToken = await this.oauthService.issueAccessToken(
      memberId,
      memberDetailId,
    );
    this.logger.debug(`postToken.accessToken -> ${accessToken}`);
    if (!accessToken) {
      throw new HttpException(
        'It fails to issue the access token.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const refreshToken = await this.oauthService.issueRefreshToken(
      memberId,
      memberDetailId,
    );
    this.logger.debug(`postToken.refreshToken -> ${refreshToken}`);
    if (!refreshToken) {
      throw new HttpException(
        'It fails to issue the refresh token.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const authorizationDataResult =
      await this.oauthService.createAuthorizationData(
        memberId,
        memberDetailId,
        JSON.stringify(authorizationData),
      );
    this.logger.debug(
      `postToken.authorizationDataResult -> ${authorizationDataResult}`,
    );
    if (!authorizationDataResult) {
      throw new HttpException(
        'It fails to create the authorization data.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const expiryResult = await this.oauthService.setExpiry(
      memberId,
      memberDetailId,
    );
    this.logger.debug(`postToken.expiryResult -> ${expiryResult}`);
    if (!expiryResult) {
      this.logger.warn('The expiry is not set.');
    }

    const deletedResult = await this.oauthService.removeAuthorizationCode(
      dto.code,
    );
    if (!deletedResult) {
      throw new HttpException(
        'It fails to remove the authorization code.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return new OauthTokenResponse(
      accessToken,
      idToken,
      this.tokenExpirySeconds,
      refreshToken,
      this.refreshTokenExpirySeconds,
    );
  }
}
