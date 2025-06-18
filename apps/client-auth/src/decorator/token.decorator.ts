import { ExecutionContext, Logger } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common/decorators';
import { Request } from 'express';
import { SignToken } from '../type/service/sign.service.type';

const logger = new Logger('TokenInfo.createParamDecorator');

export const TokenInfo = createParamDecorator<SignToken>(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();
    logger.debug(
      `TokenInfo.createParamDecorator.request.signToken -> ${JSON.stringify(request.signToken)}`,
    );
    return request.signToken;
  },
);
