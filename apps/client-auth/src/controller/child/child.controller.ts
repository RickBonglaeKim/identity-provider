import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import { Controller, Get, Logger, Param, UseInterceptors } from '@nestjs/common';
import { ChildService } from '../../service/child/child.service';
import { ExceptionService } from '@app/exception/service/exception.service';
import { ConfigService } from '@nestjs/config';

@Controller('child')
@UseInterceptors(TransformInterceptor)
export class ChildController {
  private readonly logger = new Logger(ChildController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly exceptionService: ExceptionService,
    private readonly childService: ChildService,
  ) {}

  @Get('/:id')
  async getChildren(@Param('id') id: number) {
    const children = await this.childService.findChildByMemberId(id);
    return children;
  }
}
