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
import { AuthorizationTokenCacheRepository } from '@app/cache/repository/authorization.token.cache.repository';
import { ChildResponse } from 'dto/interface/child/response/child.response.dto';
import { MemberDetailResponseRead } from 'dto/interface/member.detail/response/member.detail.response.read.dto';
import { MemberPhoneResponseRead } from 'dto/interface/member.phone/response/member.phone.response.read.dto';
import { SignVerification } from '../../type/service/oauth.service.type';
import * as cryptoJS from 'crypto-js';
import { MemberKey, SignToken } from '../../type/service/sign.service.type';

@Injectable()
export class OauthService {
  private readonly logger = new Logger(OauthService.name);
  private readonly memberKeyEncryptionKey: string;
  private readonly signTokenEncryptionKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly exceptionService: ExceptionService,
    private readonly oauthRepository: OauthRepository,
    private readonly passportCacheRepository: PassportCacheRepository,
    private readonly authorizationCodeCacheRepository: AuthorizationCodeCacheRepository,
    private readonly idTokenKeypairRepository: IdTokenKeypairRepository,
    private readonly authorizationTokenCacheRepository: AuthorizationTokenCacheRepository,
  ) {
    this.memberKeyEncryptionKey = this.configService.getOrThrow<string>(
      'MEMBER_KEY_ENCRYPTION_KEY',
    );
    this.signTokenEncryptionKey = this.configService.getOrThrow<string>(
      'SIGN_TOKEN_ENCRYPTION_KEY',
    );
  }

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

  createMemberKey(memberKey: MemberKey): string | undefined {
    try {
      const encryptedMemberKey = cryptoJS.AES.encrypt(
        JSON.stringify({
          memberId: memberKey.memberId,
          memberDetailId: memberKey.memberDetailId,
          passportKey: memberKey.passportKey,
          timestamp: Date.now(),
        }),
        this.memberKeyEncryptionKey,
      ).toString();
      this.logger.debug(
        `createMemberKey.encryptedMemberKey -> ${encryptedMemberKey}`,
      );
      return encodeURIComponent(encryptedMemberKey);
    } catch (error) {
      this.logger.error(`createMemberKey.error -> ${error}`);
      return;
    }
  }

  async verifyClient(
    clientId: string,
    redirectUri: string,
  ): Promise<SignVerification> {
    const verifiedResult =
      await this.oauthRepository.verifyAuthorizationByClientIdAndRedirectUri(
        clientId,
        redirectUri,
      );
    if (!verifiedResult) this.exceptionService.notRecognizedError();
    this.logger.debug(
      `verifyClientByClientIdAndClientSecret.verifiedResult -> ${JSON.stringify(verifiedResult)}`,
    );
    return {
      isVerified: verifiedResult!.isSucceed,
      signCode: verifiedResult!.data?.signCode,
    };
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
    passportKey: string,
    data: string,
  ): Promise<string | undefined> {
    const code = cryptoRandomString({
      length: 32,
      type: 'url-safe',
    });
    const passportResult =
      await this.passportCacheRepository.deletePassport(passportKey);
    if (!passportResult.isSucceed) return;
    const key = this.authorizationCodeCacheRepository.createKey(code);
    const codeResult =
      await this.authorizationCodeCacheRepository.setAuthorizationCode(
        key,
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
      await this.authorizationCodeCacheRepository.deleteAuthorizationCode(code);
    return result.isSucceed;
  }

  async findDataInAuthorizationCode(
    code: string,
  ): Promise<OauthAuthorizeRequestCreate | undefined> {
    const result = await this.authorizationCodeCacheRepository.getData(code);
    if (!result) this.exceptionService.notRecognizedError();
    if (!result.isSucceed || !result.data) return;
    return JSON.parse(result.data) as OauthAuthorizeRequestCreate;
  }

  async findMemberIdInAuthorizationCode(code: string): Promise<number> {
    const result =
      await this.authorizationCodeCacheRepository.getMemberId(code);
    if (!result) this.exceptionService.notRecognizedError();
    if (!result.isSucceed && !result.data)
      this.exceptionService.notGottenCacheValue('memberId');
    return JSON.parse(result.data!) as number;
  }

  async findMemberDetailIdInAuthorizationCode(code: string): Promise<number> {
    const result =
      await this.authorizationCodeCacheRepository.getMemberDetailId(code);
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
    memberId: number,
    memberDetailId: number,
    privateKey: string,
    aud: string, // client_id (oauth)
    iss: string, // constant (ID_TOKEN.ISS)
    sub: string, // clientId.clientMemberId (Database)
    exp: number, // Expiration Time
    payload: type.IdTokenPayload, // token payload
  ): Promise<string | undefined> {
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
    const key = this.authorizationTokenCacheRepository.createKey(
      memberId,
      memberDetailId,
    );
    const result = await this.authorizationTokenCacheRepository.setIdToken(
      key,
      idToken,
    );
    if (result) return idToken;
  }

  async issueAccessToken(
    memberId: number,
    memberDetailId: number,
  ): Promise<string | undefined> {
    let encryptedSignToken: string | undefined;
    const signToken: SignToken = {
      memberId,
      memberDetailId,
      timestamp: Date.now(),
      nonce: cryptoRandomString({ length: 32, type: 'alphanumeric' }),
    };

    try {
      encryptedSignToken = cryptoJS.AES.encrypt(
        JSON.stringify(signToken),
        this.signTokenEncryptionKey,
      ).toString();
      this.logger.debug(
        `issueAccessToken.encryptedSignToken -> ${encryptedSignToken}`,
      );
    } catch (error) {
      this.logger.error(`issueAccessToken.error -> ${error}`);
      return;
    }
    const key = this.authorizationTokenCacheRepository.createKey(
      memberId,
      memberDetailId,
    );
    const result = await this.authorizationTokenCacheRepository.setAccessToken(
      key,
      encryptedSignToken,
    );
    if (result) return encryptedSignToken;
  }

  async issueRefreshToken(
    memberId: number,
    memberDetailId: number,
  ): Promise<string | undefined> {
    const refreshToken = cryptoRandomString({ length: 512, type: 'base64' });
    const key = this.authorizationTokenCacheRepository.createKey(
      memberId,
      memberDetailId,
    );
    const result = await this.authorizationTokenCacheRepository.setRefreshToken(
      key,
      refreshToken,
    );
    if (result) return refreshToken;
  }

  async existAuthorizationToken(
    memberId: number,
    memberDetailId: number,
  ): Promise<boolean> {
    const key = this.authorizationTokenCacheRepository.createKey(
      memberId,
      memberDetailId,
    );
    return await this.authorizationTokenCacheRepository.existAuthorizationToken(key);
  }

  async createClientMemberId(
    memberId: number,
    memberDetailId: number,
    clientMemberId: number,
  ): Promise<boolean> {
    const key = this.authorizationTokenCacheRepository.createKey(
      memberId,
      memberDetailId,
    );
    this.logger.debug(`createClientMemberId.key -> ${JSON.stringify(key)}`);
    this.logger.debug(
      `createClientMemberId.clientMemberId -> ${clientMemberId}`,
    );
    const result =
      await this.authorizationTokenCacheRepository.setClientMemberId(
        key,
        clientMemberId.toString(),
      );
    return result.isSucceed;
  }

  async createAuthorizationData(
    memberId: number,
    memberDetailId: number,
    data: string,
  ): Promise<boolean> {
    const key = this.authorizationTokenCacheRepository.createKey(
      memberId,
      memberDetailId,
    );
    const result = await this.authorizationTokenCacheRepository.setData(
      key,
      data,
    );
    return result.isSucceed;
  }

  async setExpiry(memberId: number, memberDetailId: number): Promise<boolean> {
    const key = this.authorizationTokenCacheRepository.createKey(
      memberId,
      memberDetailId,
    );
    const result = await this.authorizationTokenCacheRepository.setExpiry(key);
    return result;
  }

  async removeAuthorizationToken(
    memberId: number,
    memberDetailId: number,
  ): Promise<boolean> {
    const key = this.authorizationTokenCacheRepository.createKey(
      memberId,
      memberDetailId,
    );
    const result = await this.authorizationTokenCacheRepository.delete(key);
    return result.isSucceed;
  }
}
