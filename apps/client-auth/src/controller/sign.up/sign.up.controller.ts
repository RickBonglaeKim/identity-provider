import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import {
  Body,
  Controller,
  Logger,
  Post,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { SignupService } from '../../service/sign.up/sign.up.service';
import { SignupRequestCreate } from 'dto/interface/sign.up/request/sign.up.request.create.dto';
import { SignupWithPhoneRequestCreate } from 'dto/interface/sign.up/request/phone/sign.up.phone.request.create.dto';

@Controller('signup')
@UseInterceptors(TransformInterceptor)
export class SignupController {
  private readonly logger = new Logger(SignupController.name);

  constructor(private readonly signupService: SignupService) {}

  @Post()
  async postSignup(
    @Res({ passthrough: true }) response: Response,
    @Body() dto: SignupRequestCreate,
  ): Promise<void> {
    this.logger.debug('postSignup');
    const result = await this.signupService.createSignupWithoutDuplication(dto);
    if (!result) {
      response.status(251);
      return;
    }
  }

  @Post('/phone')
  async postSignupWithPhone(
    @Res({ passthrough: true }) response: Response,
    @Body() dto: SignupWithPhoneRequestCreate,
  ): Promise<void> {
    const result = await this.signupService.createSignupWithPhone(dto);
    if (!result) {
      response.status(251);
      return;
    }
  }
}
