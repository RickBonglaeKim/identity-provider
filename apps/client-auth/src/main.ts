import { NestFactory } from '@nestjs/core';
import { ClientAuthModule } from './client-auth.module';
import { ServiceExceptionFilter } from '@app/exception/filter/service.exception.filter';
import { LogInterceptor } from '@app/interceptor/log.interceptor';
import { ZodValidationPipe } from 'nestjs-zod';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';

async function bootstrap() {
  let httpsOptions:
    | {
        key: Buffer<ArrayBufferLike>;
        cert: Buffer<ArrayBufferLike>;
      }
    | undefined;
  if (process.env.NODE_ENV === 'local') {
    httpsOptions = {
      key: fs.readFileSync('./cert/localhost-key.pem'),
      cert: fs.readFileSync('./cert/localhost.pem'),
    };
  }

  const app = await NestFactory.create(ClientAuthModule, { httpsOptions });
  app.useGlobalFilters(new ServiceExceptionFilter());
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalInterceptors(new LogInterceptor());
  app.use(cookieParser());
  app.enableCors({
    origin: [
      'https://dev-oauth.artbonbon.co.kr',
      'https://localhost:3000',
      'https://kauth.kakao.com',
      'https://nid.naver.com',
    ],
    method: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  await app.listen(process.env.port ?? 3000);
}
void bootstrap();
