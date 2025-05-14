import { ExceptionService } from '@app/exception/service/exception.service';
import { ClientRepository } from '@app/persistence/schema/main/repository/client.repository';
import { Injectable, Logger } from '@nestjs/common';
import { FindClientByClientIdReturn } from '../../type/service/client.service.type';

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);

  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly exceptionService: ExceptionService,
  ) {}

  async findClientByClientId(
    clientId: string,
  ): Promise<FindClientByClientIdReturn> {
    const result = await this.clientRepository.selectClientByClientId(clientId);
    if (!result) this.exceptionService.notRecognizedError();
    if (!result?.isSucceed || !result.data)
      this.exceptionService.notSelectedEntity('client');

    return {
      id: result!.data!.id,
      clientId: result!.data!.clientId,
      clientSecret: result!.data!.clientSecret,
    };
  }
}
