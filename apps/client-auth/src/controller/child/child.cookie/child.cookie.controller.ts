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
import { ChildService } from '../../../service/child/child.service';
import { ChildRequestCreate } from 'dto/interface/child/request/child.request.create.dto';
import { SignGuard } from '../../../guard/sign.guard';
import { SignInfo } from '../../../decorator/sign.decorator';
import { SignCookie } from '../../../type/service/sign.service.type';
import { ChildResponse } from 'dto/interface/child/response/child.response.dto';

@Controller('child/cookie')
@UseGuards(SignGuard)
@UseInterceptors(TransformInterceptor)
export class ChildCookieController {
  private readonly logger = new Logger(ChildCookieController.name);

  constructor(private readonly childService: ChildService) {}

  @Get()
  async getChildren(
    @SignInfo() signCookie: SignCookie,
  ): Promise<ChildResponse[]> {
    const children = await this.childService.findChildByMemberId(
      signCookie.memberId,
    );
    return children;
  }

  @Get('/:id')
  async getChildById(
    @SignInfo() signCookie: SignCookie,
    @Param('id') id: number,
  ): Promise<ChildResponse | null> {
    const child = await this.childService.findChildByMemberIdAndId(
      signCookie.memberId,
      id,
    );
    return child;
  }

  @Post()
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
  async updateChild(
    @Param('id') id: number,
    @SignInfo() signCookie: SignCookie,
    @Body() dto: ChildRequestCreate,
  ): Promise<number> {
    this.logger.debug(`updateChild.signCookie -> ${JSON.stringify(dto)}`);
    const childId = await this.childService.updateChildByMemberIdAndId(
      id,
      signCookie.memberId,
      dto,
    );
    return childId;
  }

  @Delete('/:id')
  async deleteChild(
    @SignInfo() signCookie: SignCookie,
    @Param('id') id: number,
  ): Promise<number> {
    const childId = await this.childService.deleteChildByMemberIdAndId(
      signCookie.memberId,
      id,
    );
    return childId;
  }
}
