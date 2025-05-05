import { Module } from '@nestjs/common';
import { CommunicationSecurityController } from './communication-security.controller';
import { CommunicationSecurityService } from './communication-security.service';

@Module({
  imports: [],
  controllers: [CommunicationSecurityController],
  providers: [CommunicationSecurityService],
})
export class CommunicationSecurityModule {}
