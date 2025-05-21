import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import {
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { ChildService } from '../../service/child/child.service';
import { ExceptionService } from '@app/exception/service/exception.service';
import { ConfigService } from '@nestjs/config';
import { ChildRequestCreate } from 'dto/interface/child/request/child.request.create.dto';

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

  @Post()
  async createChild(dto: ChildRequestCreate) {
    const childId = await this.childService.createChild(dto);
    return childId;
  }

  @Put('/:id')
  async updateChild(@Param('id') id: number, dto: ChildRequestCreate) {
    const childId = await this.childService.updateChildById(id, dto);
    return childId;
  }
}
