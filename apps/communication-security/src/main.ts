import { NestFactory } from '@nestjs/core';
import { CommunicationSecurityModule } from './communication-security.module';

async function bootstrap() {
  const app = await NestFactory.create(CommunicationSecurityModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
