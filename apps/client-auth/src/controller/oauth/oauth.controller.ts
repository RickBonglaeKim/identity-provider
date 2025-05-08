import { Controller, Logger } from '@nestjs/common';

@Controller('oauth')
export class OauthController {
  private readonly logger = new Logger(OauthController.name);
}
