import { PassportCacheRepository } from '@app/cache/repository/passport.cache.repository';
import { ExceptionService } from '@app/exception/service/exception.service';
import { Injectable, Logger } from '@nestjs/common';
import cryptoRandomString from 'crypto-random-string';
import * as jose from 'jose';
import { ConfigService } from '@nestjs/config';
import { OauthAuthorizeRequestCreate } from 'dto/interface/oauth/authorize/request/oauth.authorize.request.create.dto';
import { OauthRepository } from '@app/persistence/schema/main/repository/oauth.repository';
import { AuthorizationCodeCacheRepository } from '@app/cache/repository/authorization.code.cache.repository';
import { IdTokenKeypairRepository } from '@app/persistence/schema/main/repository/id.token.keypair.repository';
import * as type from '../../type/service/oauth.service.type';
import { AuthorizationAccessTokenCacheRepository } from '@app/cache/repository/authorization.token.access.cache.repository';
import { AuthorizationRefreshTokenCacheRepository } from '@app/cache/repository/authorization.token.refresh.cache.repository';
import { ChildResponse } from 'dto/interface/child/response/child.response.dto';
import { MemberDetailResponseRead } from 'dto/interface/member.detail/response/member.detail.response.read.dto';
import { MemberPhoneResponseRead } from 'dto/interface/member.phone/response/member.phone.response.read.dto';

@Injectable()
export class OauthService {
  private readonly logger = new Logger(OauthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly exceptionService: ExceptionService,
    private readonly oauthRepository: OauthRepository,
    private readonly passportCacheRepository: PassportCacheRepository,
    private readonly authorizationCodeRepository: AuthorizationCodeCacheRepository,
    private readonly idTokenKeypairRepository: IdTokenKeypairRepository,
    private readonly authorizationAccessTokenCacheRepository: AuthorizationAccessTokenCacheRepository,
    private readonly authorizationRefreshTokenCacheRepository: AuthorizationRefreshTokenCacheRepository,
  ) {}

  createRedirectUri(uri: string): type.CreateRedirectUriReturn {
    let redirectUri: string = uri;
    return (state: type.OauthState) => {
      if (state) redirectUri += `?state=${state}`;
      return (error: type.OauthError) => {
        if (error) redirectUri += `${state ? '&' : '?'}error=${error}`;
        return (errorDescription: type.OauthErrorDescription) => {
          if (errorDescription)
            redirectUri += `&error_description=${errorDescription}`;
          return (errorUri: type.OauthErrorUri) => {
            if (errorUri) redirectUri += `&error_uri=${errorUri}`;
            return redirectUri;
          };
        };
      };
    };
  }

  async verifyClient(clientId: string, redirectUri: string): Promise<boolean> {
    const verifiedResult =
      await this.oauthRepository.verifyAuthorizationByClientIdAndRedirectUri(
        clientId,
        redirectUri,
      );
    this.logger.debug(
      `verifyClientByClientIdAndClientSecret.verifiedResult -> ${JSON.stringify(verifiedResult)}`,
    );
    if (!verifiedResult?.isSucceed) return false;

    return true;
  }

  async createPassport(
    data: OauthAuthorizeRequestCreate,
  ): Promise<string | undefined> {
    const passportKey = cryptoRandomString({ length: 64, type: 'url-safe' });
    this.logger.debug(`createPassport.passportKey -> ${passportKey}`);
    const result = await this.passportCacheRepository.setPassport(
      passportKey,
      JSON.stringify(data),
    );
    this.logger.debug(`createPassport.result -> ${JSON.stringify(result)}`);

    if (result.isSucceed) return passportKey;
  }

  async findPassport(key: string): Promise<string | undefined> {
    const passportResult = await this.passportCacheRepository.getPassport(key);
    if (passportResult.isSucceed && passportResult.data)
      return passportResult.data;
  }

  async createAuthorizationCode(
    memberId: number,
    memberDetailId: number,
    passport: string,
    data: string,
  ): Promise<string | undefined> {
    const code = cryptoRandomString({
      length: 32,
      type: 'url-safe',
    });
    // const transaction = this.passportCacheRepository.getTransaction();
    const passportResult =
      await this.passportCacheRepository.deletePassport(passport);
    if (!passportResult.isSucceed) return;
    const codeResult =
      await this.authorizationCodeRepository.setAuthorizationCode(
        code,
        memberId.toString(),
        memberDetailId.toString(),
        data,
      );
    this.logger.debug(
      `createAuthorizationCode.codeResult -> ${JSON.stringify(codeResult)}`,
    );
    if (codeResult.isSucceed) return code;
  }

  async removeAuthorizationCode(code: string): Promise<boolean> {
    const result =
      await this.authorizationCodeRepository.deleteAuthorizationCode(code);
    return result.isSucceed;
  }

  async findDataInAuthorizationCode(
    code: string,
  ): Promise<OauthAuthorizeRequestCreate> {
    const result =
      await this.authorizationCodeRepository.getDataInAuthorizationCode(code);
    if (!result) this.exceptionService.notRecognizedError();
    if (!result.isSucceed && !result.data)
      this.exceptionService.notGottenCacheValue('data');
    return JSON.parse(result.data!) as OauthAuthorizeRequestCreate;
  }

  async findMemberIdInAuthorizationCode(code: string): Promise<number> {
    const result =
      await this.authorizationCodeRepository.getMemberIdInAuthorizationCode(
        code,
      );
    if (!result) this.exceptionService.notRecognizedError();
    if (!result.isSucceed && !result.data)
      this.exceptionService.notGottenCacheValue('memberId');
    return JSON.parse(result.data!) as number;
  }

  async findMemberDetailIdInAuthorizationCode(code: string): Promise<number> {
    const result =
      await this.authorizationCodeRepository.getMemberDetailIdInAuthorizationCode(
        code,
      );
    if (!result) this.exceptionService.notRecognizedError();
    if (!result.isSucceed && !result.data)
      this.exceptionService.notGottenCacheValue('memberDetailId');
    return JSON.parse(result.data!) as number;
  }

  async findIdTokenKeypair(): Promise<type.Keypair> {
    const keypairResult =
      await this.idTokenKeypairRepository.selectOneIdTokenKeypairByIsActivatedOrderByRandom();
    if (!keypairResult) this.exceptionService.notRecognizedError();
    if (!keypairResult?.isSucceed || !keypairResult.data)
      this.exceptionService.notSelectedEntity('id token keypair');

    return {
      privateKey: JSON.stringify(keypairResult?.data?.privateKey),
      publicKey: JSON.stringify(keypairResult?.data?.publicKey),
    };
  }

  createIdTokenPayloadByScope(
    memberGroup: [
      MemberDetailResponseRead,
      MemberPhoneResponseRead[],
      ChildResponse[],
    ],
    scope: string,
  ): type.IdTokenPayload {
    const memberDetail = memberGroup[0];
    const memberPhone = memberGroup[1];
    const memberChild = memberGroup[2];
    const idTokenPayload: type.IdTokenPayload = {};
    const scopeValues = scope.split(' ');
    for (const value of scopeValues) {
      if (value === type.IdTokenPayloadKey.name)
        idTokenPayload.name = memberDetail.name;
      if (value === type.IdTokenPayloadKey.email)
        idTokenPayload.email = memberDetail.email;
      if (value === type.IdTokenPayloadKey.phone) {
        idTokenPayload.phone = [];
        for (const number of memberPhone) {
          idTokenPayload.phone.push({
            countryCallingCode: number.countryCallingCode,
            number: number.phoneNumber,
          });
        }
      }
      if (value === type.IdTokenPayloadKey.child) {
        idTokenPayload.child = [];
        for (const child of memberChild) {
          idTokenPayload.child.push({
            id: child.id,
            createAt: child.createdAt,
            name: child.name,
            birthday: child.birthDay,
            gender: child.gender,
          });
        }
      }
    }
    return idTokenPayload;
  }

  async issueIdToken(
    privateKey: string,
    aud: string, // client_id (oauth)
    iss: string, // constant (ID_TOKEN.ISS)
    sub: string, // clientId.clientMemberId (Database)
    exp: number, // Expiration Time
    payload: type.IdTokenPayload, // token payload
  ) {
    privateKey = privateKey.replaceAll('\\"', '"').slice(1, -1);
    const privateJWK = JSON.parse(privateKey) as jose.JWK;
    const expirySeconds =
      this.configService.getOrThrow<number>('TOKEN_EXPIRE_IN');
    const idToken = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(iss)
      .setAudience(aud)
      .setSubject(sub)
      .setIssuedAt()
      .setExpirationTime(`${exp}seconds`)
      .setExpirationTime(`${expirySeconds}seconds`)
      .sign(privateJWK);
    return idToken;
  }

  async issueAccessToken(
    memberId: number,
    memberDetailId: number,
    clientMemberId: number,
    data: OauthAuthorizeRequestCreate,
  ): Promise<string | undefined> {
    const accessToken = cryptoRandomString({ length: 256, type: 'base64' });
    const result =
      await this.authorizationAccessTokenCacheRepository.setAccessToken(
        accessToken,
        memberId.toString(),
        memberDetailId.toString(),
        clientMemberId.toString(),
        JSON.stringify(data),
      );
    if (result) return accessToken;
  }

  async issueRefreshToken(
    memberId: number,
    memberDetailId: number,
    clientMemberId: number,
    data: OauthAuthorizeRequestCreate,
  ): Promise<string | undefined> {
    const refreshToken = cryptoRandomString({ length: 512, type: 'base64' });
    const result =
      await this.authorizationRefreshTokenCacheRepository.setRefreshToken(
        refreshToken,
        memberId.toString(),
        memberDetailId.toString(),
        clientMemberId.toString(),
        JSON.stringify(data),
      );
    if (result) return refreshToken;
  }
}
