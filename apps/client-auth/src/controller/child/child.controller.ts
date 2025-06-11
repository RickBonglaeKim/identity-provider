import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ChildService } from '../../service/child/child.service';
import { ChildRequestCreate } from 'dto/interface/child/request/child.request.create.dto';
import { SignGuard } from '../../guard/sign.guard';
import { SignInfo } from '../../decorator/sign.decorator';
import { SignCookie } from '../../type/service/sign.service.type';
import { ChildResponse } from 'dto/interface/child/response/child.response.dto';

@Controller('child')
@UseInterceptors(TransformInterceptor)
export class ChildController {
  private readonly logger = new Logger(ChildController.name);

  constructor(private readonly childService: ChildService) {}

  @Get()
  @UseGuards(SignGuard)
  async getChildren(
    @SignInfo() signCookie: SignCookie,
  ): Promise<ChildResponse[]> {
    const children = await this.childService.findChildByMemberId(
      signCookie.memberId,
    );
    return children;
  }

  @Post()
  @UseGuards(SignGuard)
  async createChild(
    @SignInfo() signCookie: SignCookie,
    @Body() dto: ChildRequestCreate,
  ): Promise<number> {
    this.logger.debug(`createChild.signCookie -> ${JSON.stringify(dto)}`);
    const childId = await this.childService.createChild(
      signCookie.memberId,
      dto,
    );
    return childId;
  }

  @Patch('/:id')
  @UseGuards(SignGuard)
  async updateChild(
    @SignInfo() signCookie: SignCookie,
    @Param('id') id: number,
    @Body() dto: ChildRequestCreate,
  ): Promise<number> {
    this.logger.debug(`updateChild.signCookie -> ${JSON.stringify(dto)}`);
    const childId = await this.childService.updateChildById(
      id,
      signCookie.memberId,
      dto,
    );
    return childId;
  }

  @Delete('/:id')
  @UseGuards(SignGuard)
  async deleteChild(@Param('id') id: number): Promise<number> {
    const childId = await this.childService.deleteChildById(id);
    return childId;
  }
}
