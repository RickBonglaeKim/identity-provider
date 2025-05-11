import { PassportCacheRepository } from '@app/cache/repository/passport.cache.repository';
import { ExceptionService } from '@app/exception/exception.service';
import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';
import cryptoRandomString from 'crypto-random-string';
import { ConfigService } from '@nestjs/config';
import { AuthorizeCreateRequest } from 'dto/interface/oauth/authorize/create/authorize.create.request.dto';
import { OauthRepository } from '@app/persistence/schema/main/repository/oauth.repository';

@Injectable()
export class OauthService {
  private readonly logger = new Logger(OauthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly exceptionService: ExceptionService,
    private readonly oauthRepository: OauthRepository,
    private readonly passportCacheRepository: PassportCacheRepository,
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

  @Transactional()
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

    if (result.isSucceed) return passportKey;
  }
}
