import { Injectable } from '@nestjs/common';
import ServiceException from '../error/service.error';

@Injectable()
export class ExceptionService {
  unAuthorized() {
    throw new ServiceException(401, `This http request is not authorized.`);
  }

  notInsertedEntity(entityName: string) {
    throw new ServiceException(
      901,
      `The ${entityName} entity is not inserted.`,
    );
  }

  notSelectedEntity(entityName: string) {
    throw new ServiceException(
      902,
      `The ${entityName} entity is not selected.`,
    );
  }

  notUpdatedEntity(entityName: string) {
    throw new ServiceException(903, `The ${entityName} entity is not updated.`);
  }

  notDeletedEntity(entityName: string) {
    throw new ServiceException(904, `The ${entityName} entity is not deleted.`);
  }

  notSetCacheValue(keyName: string) {
    throw new ServiceException(911, `The ${keyName} value is not set.`);
  }

  notGottenCacheValue(keyName: string) {
    throw new ServiceException(912, `The ${keyName} value is not gotten.`);
  }

  notUpdatedCacheValue(keyName: string) {
    throw new ServiceException(913, `The ${keyName} value is not updated.`);
  }

  notDeletedCacheValue(keyName: string) {
    throw new ServiceException(914, `The ${keyName} value is not deleted.`);
  }

  notGeneratedKeypair() {
    throw new ServiceException(911, `The keypair is not generated.`);
  }

  notRecognizedError() {
    throw new ServiceException(999, `The error not recognized is occurred.`);
  }
}
