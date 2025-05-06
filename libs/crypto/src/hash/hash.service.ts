import { Injectable, Logger } from '@nestjs/common';
import bcrypt from 'bcrypt';

@Injectable()
export class HashService {
  private readonly saltRounds = 10;
  private readonly logger = new Logger(HashService.name);

  async generateHash(text: string): Promise<string> {
    return await bcrypt.hash(text, this.saltRounds);
  }

  async compareHash(text: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(text, hash);
  }
}
