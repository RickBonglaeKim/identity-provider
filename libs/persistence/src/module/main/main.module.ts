import { mainConnection } from '@app/persistence/persistence.connection.main';
import { Module } from '@nestjs/common';

@Module({
  providers: [mainConnection],
})
export class MainModule {}
