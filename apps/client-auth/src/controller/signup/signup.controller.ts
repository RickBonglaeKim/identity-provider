import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import { Controller, Get, Post, UseInterceptors } from '@nestjs/common';
import { SignupService } from './signup.service';
import { SignupCreateRequest } from 'dto/interface/signup/create/signup.create.request.dto';
import { SignupWithPhoneCreateRequest } from 'dto/interface/signup/create/signup.phone.create.request.dto';

@Controller('signup')
@UseInterceptors(TransformInterceptor)
export class SignupController {
  constructor(private readonly signupService: SignupService) {}

  @Post()
  async postSignup(dto: SignupCreateRequest): Promise<void> {
    await this.signupService.createSignup(dto);
  }

  @Post()
  async postSignupWithPhone(dto: SignupWithPhoneCreateRequest): Promise<void> {
    await this.signupService.createSignupWithPhone(dto);
  }
}
