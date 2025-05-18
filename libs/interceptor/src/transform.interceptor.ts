import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import CommonResponse from 'dto/interface/response.dto';
import { map, Observable } from 'rxjs';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, CommonResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<CommonResponse<T>> | Promise<Observable<CommonResponse<T>>> {
    return next.handle().pipe(
      map((data) => {
        const request = context.switchToHttp().getRequest<Request>();
        const language = (
          request.headers['service-content-language'] || 'ko'
        ).toString();
        const response = new CommonResponse<T>(language);
        response.resultData = typeof data === 'undefined' ? null : data;
        return response;
      }),
    );
  }
}
