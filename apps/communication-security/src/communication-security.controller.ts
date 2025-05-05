import { Controller, Get } from '@nestjs/common';
import { CommunicationSecurityService } from './communication-security.service';

@Controller()
export class CommunicationSecurityController {
  constructor(
    private readonly communicationSecurityService: CommunicationSecurityService,
  ) {}

  @Get()
  getHello(): string {
    return this.communicationSecurityService.getHello();
  }
}
