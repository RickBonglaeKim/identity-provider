import { Controller, Get } from '@nestjs/common';
import { ClientAuthService } from './client-auth.service';

@Controller()
export class ClientAuthController {
  constructor(private readonly clientAuthService: ClientAuthService) {}

  @Get()
  getHello(): string {
    return this.clientAuthService.getHello();
  }
}
