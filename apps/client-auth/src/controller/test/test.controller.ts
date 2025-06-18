import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import {
  Controller,
  Get,
  Logger,
  Query,
  UseInterceptors,
} from '@nestjs/common';

@Controller('test')
@UseInterceptors(TransformInterceptor)
export class TestController {
  private readonly logger = new Logger(TestController.name);

  @Get('callback')
  getCallback(
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
    @Query('error_description') error_description?: string,
  ) {
    const requestQueries: {
      code?: string;
      state?: string;
      error?: string;
      error_description?: string;
    } = {
      code,
      state,
      error,
      error_description,
    };
    this.logger.debug(
      `getCallback.requestQueries -> ${JSON.stringify(requestQueries)}`,
    );
    return requestQueries;
  }

  @Get('child')
  getChild() {
    return [
      {
        id: crypto.randomUUID(),
        name: '딸1',
        birthDay: '2010-05-30',
        gender: 'GENDER.FEMALE',
      },
      {
        id: crypto.randomUUID(),
        name: '아들1',
        birthDay: '2013-12-30',
        gender: 'GENDER.MALE',
      },
    ];
  }
}
