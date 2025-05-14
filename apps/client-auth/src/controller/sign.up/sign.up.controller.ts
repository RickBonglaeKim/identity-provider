import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import {
  Body,
  Controller,
  Logger,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { SignupService } from '../../service/sign.up/sign.up.service';
import { SignupRequestCreate } from 'dto/interface/sign.up/request/sign.up.request.create.dto';
import { SignupWithPhoneRequestCreate } from 'dto/interface/sign.up/request/sign.up.phone.request.create.dto';

@Controller('signup')
@UseInterceptors(TransformInterceptor)
export class SignupController {
  private readonly logger = new Logger(SignupController.name);

  constructor(private readonly signupService: SignupService) {}

  @Post()
  async postSignup(@Body() dto: SignupRequestCreate): Promise<void> {
    this.logger.debug('postSignup');
    await this.signupService.createSignup(dto);
  }

  @Post('/phone')
  async postSignupWithPhone(
    @Body() dto: SignupWithPhoneRequestCreate,
  ): Promise<void> {
    await this.signupService.createSignupWithPhone(dto);
  }
}
