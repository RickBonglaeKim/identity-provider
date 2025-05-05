import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import ServiceException from '../error/service.error';
import { Request, Response } from 'express';

@Catch(ServiceException)
export class ServiceExceptionFilter implements ExceptionFilter {
  catch(exception: ServiceException, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const statusCode = exception.code;
    response.status(statusCode).json({
      path: request.url,
      message: exception.message,
    });
  }
}
