import { PassportCacheRepository } from '@app/cache/repository/passport.cache.repository';
import { ExceptionService } from '@app/exception/exception.service';
import { Injectable, Logger } from '@nestjs/common';
import cryptoRandomString from 'crypto-random-string';
import { ConfigService } from '@nestjs/config';
import { AuthorizeCreateRequest } from 'dto/interface/oauth/authorize/create/authorize.create.request.dto';
import { OauthRepository } from '@app/persistence/schema/main/repository/oauth.repository';
import { AuthorizationCodeCacheRepository } from '@app/cache/repository/authorization.code.cache.repository';

@Injectable()
export class OauthService {
  private readonly logger = new Logger(OauthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly exceptionService: ExceptionService,
    private readonly oauthRepository: OauthRepository,
    private readonly passportCacheRepository: PassportCacheRepository,
    private readonly authorizationCodeRepository: AuthorizationCodeCacheRepository,
  ) {}

  public createRedirectUri(uri: string): oauthRedirection {
    let redirectUri: string = uri;
    return (state: oauthState) => {
      if (state) redirectUri += `?state=${state}`;
      return (error: oauthError) => {
        if (error) redirectUri += `${state ? '&' : '?'}error=${error}`;
        return (errorDescription: oauthErrorDescription) => {
          if (errorDescription)
            redirectUri += `&error_description=${errorDescription}`;
          return (errorUri: oauthErrorUri) => {
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
    const result = await this.passportCacheRepository.getPassport(key);
    if (result.isSucceed && result.data) return result.data;
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

}
