import { Controller, Logger } from '@nestjs/common';
import { SignupController } from '../sign.up/sign.up.controller';

@Controller('oauth')
export class OauthController {
  private readonly logger = new Logger(SignupController.name);
}
