import { Controller, Get, Logger } from '@nestjs/common';
import { KeyService } from '../../service/key/key.service';

@Controller('key')
export class KeyController {
  private readonly logger = new Logger(KeyController.name);

  constructor(private readonly keyService: KeyService) {}

  @Get('jwk')
  async getKeyJWK(): Promise<void> {
    const keyResult = await this.keyService.generateJWK();
    this.logger.debug(`getKeyJWK.keyResult -> ${JSON.stringify(keyResult)}`);
    await this.keyService.createKeypairJWK(
      JSON.stringify(keyResult.privateJWK),
      JSON.stringify(keyResult.publicJWK),
    );
  }
}
