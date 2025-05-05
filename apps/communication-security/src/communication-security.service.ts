import { Injectable } from '@nestjs/common';

@Injectable()
export class CommunicationSecurityService {
  getHello(): string {
    return 'Hello World!';
  }
}
