import { Controller, Logger } from '@nestjs/common';
import { SignupController } from '../signup/signup.controller';

@Controller('oauth')
export class OauthController {
  private readonly logger = new Logger(SignupController.name);
}
