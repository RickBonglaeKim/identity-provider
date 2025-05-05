import { NestFactory } from '@nestjs/core';
import { ClientAuthModule } from './client-auth.module';

async function bootstrap() {
  const app = await NestFactory.create(ClientAuthModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
