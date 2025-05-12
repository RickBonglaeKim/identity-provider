import { PassportCacheRepository } from '@app/cache/repository/passport.cache.repository';
import { ExceptionService } from '@app/exception/service/exception.service';
import { Injectable, Logger } from '@nestjs/common';
import cryptoRandomString from 'crypto-random-string';
import * as jose from 'jose';
import { ConfigService } from '@nestjs/config';
import { AuthorizeCreateRequest } from 'dto/interface/oauth/authorize/create/authorize.create.request.dto';
import { OauthRepository } from '@app/persistence/schema/main/repository/oauth.repository';
import { AuthorizationCodeCacheRepository } from '@app/cache/repository/authorization.code.cache.repository';
import { IdTokenKeypairRepository } from '@app/persistence/schema/main/repository/id.token.keypair.repository';
import * as type from '../../type/service/oauth.service';

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
  ) {}

  public createRedirectUri(uri: string): type.CreateRedirectUriReturn {
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

  async verifyClient(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ): Promise<boolean> {
    const verifiedResult =
      await this.oauthRepository.verifyAuthorizationByClientIdAndClientSecretAndRedirectUri(
        clientId,
        clientSecret,
        redirectUri,
      );
    this.logger.debug(
      `verifyClientByClientIdAndClientSecret.verifiedResult -> ${JSON.stringify(verifiedResult)}`,
    );
    if (!verifiedResult) this.exceptionService.notRecognizedError();
    if (!verifiedResult?.isSucceed) return false;

    return true;
  }

  async createPassport(
    data: AuthorizeCreateRequest,
  ): Promise<string | undefined> {
    const passportKey = cryptoRandomString({ length: 64, type: 'url-safe' });
    this.logger.debug(`createPassport.passportKey -> ${passportKey}`);
    const result = await this.passportCacheRepository.setPassport(
      passportKey,
      JSON.stringify(data),
    );
    this.logger.debug(`createPassport.result -> ${JSON.stringify(result)}`);

    if (result) return passportKey;
  }

  async findPassport(key: string): Promise<string | undefined> {
    const passportResult = await this.passportCacheRepository.getPassport(key);
    if (passportResult.isSucceed && passportResult.data)
      return passportResult.data;
  }

  async createAuthorizationCode(
    memberId: number,
    passport: string,
    data: string,
  ): Promise<string | undefined> {
    const code = cryptoRandomString({
      length: 32,
      type: 'url-safe',
    });
    const transaction = this.passportCacheRepository.getTransaction();
    this.passportCacheRepository.deletePassportWithTransaction(
      transaction,
      passport,
    );
    this.authorizationCodeRepository.setAuthorizationCodeWithTransaction(
      transaction,
      memberId.toString(),
      code,
      data,
    );
    const executeResult =
      await this.passportCacheRepository.executeTransaction(transaction);
    this.logger.debug(
      `createAuthorizationCode.executeResult -> ${JSON.stringify(executeResult.data)}`,
    );
    if (executeResult.isSucceed) return code;
  }

  async findDataInAuthorizationCode(
    code: string,
  ): Promise<AuthorizeCreateRequest | undefined> {
    const dataResult =
      await this.authorizationCodeRepository.getDataInAuthorizationCode(code);
    if (!dataResult) this.exceptionService.notRecognizedError();
    if (dataResult.isSucceed && dataResult.data)
      return JSON.parse(dataResult.data) as AuthorizeCreateRequest;
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

  async issueIdToke(privateKey: string) {
    privateKey = privateKey.replaceAll('\\"', '"').slice(1, -1);
    const privateJWK = JSON.parse(privateKey) as jose.JWK;
    const idToken = await new jose.SignJWT()
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(privateJWK);
    this.logger.debug(`issueIdToke.idToken -> ${idToken}`);
  }
}
