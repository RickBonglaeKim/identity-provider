import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import { Controller, Get, Post, UseInterceptors } from '@nestjs/common';
import { SignupService } from './signup.service';

@Controller('signup')
@UseInterceptors(TransformInterceptor)
export class SignupController {
  constructor(private readonly signupService: SignupService) {}

  @Get()
  async getTest(): Promise<void> {
    await this.signupService.createSignup();
  }
}
