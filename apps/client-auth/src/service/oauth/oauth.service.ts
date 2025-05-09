import { ExceptionService } from '@app/exception/exception.service';
import { ClientRepository } from '@app/persistence/schema/main/repository/client.repository';
import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OauthService {
  private readonly logger = new Logger(OauthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly clientRepository: ClientRepository,
    private readonly exceptionService: ExceptionService,
  ) {}

  createRedirectUri(uri: string): oauthRedirection {
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
    if (clientResult.data?.redirectUri === redirectUri) return false;

    return true;
  }
}
