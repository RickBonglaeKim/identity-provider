import { ExceptionService } from '@app/exception/service/exception.service';
import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OauthService } from '../oauth/oauth.service';
import * as provider from '../../type/service/provider.service.type';

@Injectable()
export class ProviderService {
  private readonly logger = new Logger(OauthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly exceptionService: ExceptionService,
  ) {}

  connectKakao(): provider.Kakao {
    throw new NotImplementedException();
  }

  connectNaver(): provider.Naver {
    throw new NotImplementedException();
  }

  connectGoogle(): provider.Google {
    throw new NotImplementedException();
  }

  connectApple(): provider.Apple {
    throw new NotImplementedException();
  }
}
