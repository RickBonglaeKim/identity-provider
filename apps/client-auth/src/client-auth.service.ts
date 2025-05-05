import { Injectable } from '@nestjs/common';

@Injectable()
export class ClientAuthService {
  getHello(): string {
    return 'Hello World!';
  }
}
