import { Injectable } from '@nestjs/common';
import ServiceException from '../error/service.error';

@Injectable()
export class ExceptionService {
  unAuthorized() {
    throw new ServiceException(401, `This http request is not authorized.`);
  }

  notInsertedEntity(entityName: string) {
    throw new ServiceException(901, `The ${entityName} entity is not created.`);
  }

  notSelectedEntity(entityName: string) {
    throw new ServiceException(902, `The ${entityName} entity is not read.`);
  }

  notUpdatedEntity(entityName) {
    throw new ServiceException(903, `The ${entityName} entity is not changed.`);
  }

  notDeletedEntity(entityName) {
    throw new ServiceException(904, `The ${entityName} entity is not deleted.`);
  }

  notGeneratedKeypair() {
    throw new ServiceException(911, `The keypair is not generated.`);
  }

  notRecognizedError() {
    throw new ServiceException(999, `The error not recognized is occurred.`);
  }
}
