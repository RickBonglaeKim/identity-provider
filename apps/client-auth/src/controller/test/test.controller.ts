import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  Query,
  Redirect,
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
}
