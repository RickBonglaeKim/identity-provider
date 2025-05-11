import { KeypairService } from '@app/crypto/keypair/keypair.service';
import { keypairJWK } from '@app/crypto/type/keypair.type';
import { ExceptionService } from '@app/exception/exception.service';
import { IdTokenKeypairRepository } from '@app/persistence/schema/main/repository/id.token.keypair.repository';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class KeyService {
  private readonly logger = new Logger(KeyService.name);

  constructor(
    private readonly keypairService: KeypairService,
    private readonly idTokenKeypairRepository: IdTokenKeypairRepository,
    private readonly exceptionService: ExceptionService,
  ) {}

  async generateJWK(): Promise<keypairJWK> {
    return await this.keypairService.generateKeypairJWK();
  }

  async createKeypairJWK(
    privateKey: string,
    publicKey: string,
  ): Promise<boolean> {
    const data = { privateKey, publicKey };
    const keypairResult =
      await this.idTokenKeypairRepository.insertIdTokenKeypair(data);
    if (!keypairResult) this.exceptionService.notRecognizedError();
    if (!keypairResult?.isSucceed) {
      this.exceptionService.notInsertedEntity('id token keypair');
      return false;
    }
    return true;
  }
}
