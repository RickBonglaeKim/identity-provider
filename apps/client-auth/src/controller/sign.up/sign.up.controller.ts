import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { SignupService } from './sign.up.service';
import { SignupCreateRequest } from 'dto/interface/sign.up/create/sign.up.create.request.dto';
import { SignupWithPhoneCreateRequest } from 'dto/interface/sign.up/create/sign.up.phone.create.request.dto';

@Controller('signup')
@UseInterceptors(TransformInterceptor)
export class SignupController {
  private readonly logger = new Logger(SignupController.name);

  constructor(private readonly signupService: SignupService) {}

  @Post()
  async postSignup(@Body() dto: SignupCreateRequest): Promise<void> {
    this.logger.debug('postSignup');
    await this.signupService.createSignup(dto);
  }

  @Post('/phone')
  async postSignupWithPhone(
    @Body() dto: SignupWithPhoneCreateRequest,
  ): Promise<void> {
    await this.signupService.createSignupWithPhone(dto);
  }
}
