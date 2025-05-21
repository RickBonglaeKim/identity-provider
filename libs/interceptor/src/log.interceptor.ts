import {
  CallHandler,
  ExecutionContext,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export class LogInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const controllerName = context.getClass().name;
    const handlerName = context.getHandler().name;
    const loggerContext = `${controllerName}-${handlerName}`;

    if (controllerName === 'HomeController') {
      return next.handle();
    }

    const logger = new Logger(loggerContext);
    logger.log(
      ` | REQUEST --> METHOD : ${request.method} , URL : ${request.url} , BODY : ${JSON.stringify(request.body)}`,
    );

    return next.handle().pipe(
      tap((observable) => {
        logger.log(
          ` | RESPONSE --> STATUS_CODE : ${response.statusCode} , BODY : ${JSON.stringify(observable)}`,
        );
      }),
    );
  }
}
