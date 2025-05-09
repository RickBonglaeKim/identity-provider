import { PassportCacheRepository } from '@app/cache/repository/passport.cache.repository';
import { ExceptionService } from '@app/exception/exception.service';
import { ClientRepository } from '@app/persistence/schema/main/repository/client.repository';
import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';
import cryptoRandomString from 'crypto-random-string';
import { ConfigService } from '@nestjs/config';
import { AuthorizeCreateRequest } from 'dto/interface/oauth/authorize/create/authorize.create.request.dto';

@Injectable()
export class OauthService {
  private readonly logger = new Logger(OauthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly exceptionService: ExceptionService,
    private readonly clientRepository: ClientRepository,
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
  async verifyClientByClientIdAndClientSecret(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ): Promise<boolean> {
    const clientResult =
      await this.clientRepository.selectClientByClientIdAndClientSecret(
        clientId,
        clientSecret,
      );
    if (!clientResult) this.exceptionService.notRecognizedError();

    if (!clientResult?.isSucceed) return false;
    if (clientResult.data?.redirectUri !== redirectUri) return false;

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
