import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HashService {
  private readonly saltRounds = 10;
  private readonly logger = new Logger(HashService.name);

  async generateHash(text: string): Promise<string> {
    const result = await bcrypt.hash(text, this.saltRounds);
    return result;
  }

  async compareHash(text: string, hash: string): Promise<boolean> {
    const result = await bcrypt.compare(text, hash);
    return result;
  }
}
