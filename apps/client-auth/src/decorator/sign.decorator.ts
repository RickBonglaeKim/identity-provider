import { ExecutionContext, Logger } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common/decorators';
import { Request } from 'express';
import { SignCookie } from '../type/service/sign.service.type';

const logger = new Logger('SignInfo.createParamDecorator');

export const SignInfo = createParamDecorator<SignCookie>(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();
    logger.debug(
      `SignInfo.createParamDecorator.request.signCookie -> ${JSON.stringify(request.signCookie)}`,
    );
    return request.signCookie;
  },
);
