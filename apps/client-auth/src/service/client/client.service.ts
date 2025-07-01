import { ExceptionService } from '@app/exception/service/exception.service';
import { ClientRepository } from '@app/persistence/schema/main/repository/client.repository';
import { Injectable, Logger } from '@nestjs/common';
import { ClientResponse } from 'dto/interface/client/response/client.response.dto';

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);

  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly exceptionService: ExceptionService,
  ) {}

  async findClientByClientId(
    clientId: string,
  ): Promise<ClientResponse | undefined> {
    const result = await this.clientRepository.selectClientByClientId(clientId);
    if (!result) this.exceptionService.notRecognizedError();
    if (!result?.isSucceed || !result.data) return;

    const data = result.data;
    return new ClientResponse(
      data.id,
      data.clientId,
      data.clientSecret,
      data.name,
    );
  }
}
