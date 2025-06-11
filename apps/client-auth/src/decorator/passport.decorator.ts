import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common/decorators';
import { Request } from 'express';

const logger = new Logger('Passport.createParamDecorator');

export const Passport = createParamDecorator<string>(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();
    const passport = request.headers.passport as string;
    if (!passport || passport.length !== 64) {
      throw new HttpException(
        'The passport is required or invalid',
        HttpStatus.UNAUTHORIZED,
      );
    }
    logger.debug(`Passport.createParamDecorator.passport -> ${passport}`);
    return passport;
  },
);
