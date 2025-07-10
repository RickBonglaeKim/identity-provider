import { Controller, Get, Logger } from '@nestjs/common';
import * as jose from 'jose';
import { KeyService } from '../../service/key/key.service';
import { OauthService } from '../../service/oauth/oauth.service';

@Controller('key')
export class KeyController {
  private readonly logger = new Logger(KeyController.name);

  constructor(
    private readonly keyService: KeyService,
    private readonly oauthService: OauthService,
  ) {}

  @Get('jwk')
  async getKeyJWK(): Promise<void> {
    const keyResult = await this.keyService.generateJWK();
    this.logger.debug(
      `getKeyJWK.keyResult.privateJWK -> ${JSON.stringify(keyResult.privateJWK)}`,
    );
    this.logger.debug(
      `getKeyJWK.keyResult.publicJWK -> ${JSON.stringify(keyResult.publicJWK)}`,
    );
    // await this.keyService.createKeypairJWK(
    //   JSON.stringify(keyResult.privateJWK),
    //   JSON.stringify(keyResult.publicJWK),
    // );
  }
}
