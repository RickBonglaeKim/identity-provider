import { NestFactory } from '@nestjs/core';
import { ClientAuthModule } from './client-auth.module';
import { ServiceExceptionFilter } from '@app/exception/filter/service.exception.filter';
import { LogInterceptor } from '@app/interceptor/log.interceptor';
import { ZodValidationPipe } from 'nestjs-zod';

async function bootstrap() {
  const app = await NestFactory.create(ClientAuthModule);
  app.useGlobalFilters(new ServiceExceptionFilter());
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalInterceptors(new LogInterceptor());
  app.enableCors();
  await app.listen(process.env.port ?? 3000);
}
void bootstrap();
