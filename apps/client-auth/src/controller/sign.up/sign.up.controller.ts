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
import { SignUpService } from '../../service/sign.up/sign.up.service';
import { SignUpRequestCreate } from 'dto/interface/sign.up/request/sign.up.request.create.dto';
import { SignUpWithPhoneRequestCreate } from 'dto/interface/sign.up/request/phone/sign.up.phone.request.create.dto';

@Controller('signUp')
@UseInterceptors(TransformInterceptor)
export class SignUpController {
  private readonly logger = new Logger(SignUpController.name);

  constructor(private readonly signUpService: SignUpService) {}

  @Post()
  async postSignUp(
    @Res({ passthrough: true }) response: Response,
    @Body() dto: SignUpRequestCreate,
  ): Promise<void> {
    this.logger.debug('postSignUp');
    const result = await this.signUpService.createSignUpWithoutDuplication(dto);
    if (!result) {
      response.status(251);
      return;
    }
  }

  @Post('/phone')
  async postSignUpWithPhone(
    @Res({ passthrough: true }) response: Response,
    @Body() dto: SignUpWithPhoneRequestCreate,
  ): Promise<void> {
    const result = await this.signUpService.createSignUpWithPhone(dto);
    if (!result) {
      response.status(251);
      return;
    }
  }
}
