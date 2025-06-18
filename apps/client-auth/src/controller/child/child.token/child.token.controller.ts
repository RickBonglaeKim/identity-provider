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
import { SignCookie, SignToken } from '../../../type/service/sign.service.type';
import { ChildResponse } from 'dto/interface/child/response/child.response.dto';
import { TokenGuard } from '../../../guard/token.guard';
import { TokenInfo } from 'apps/client-auth/src/decorator/token.decorator';

@Controller('child/token')
@UseGuards(TokenGuard)
@UseInterceptors(TransformInterceptor)
export class ChildTokenController {
  private readonly logger = new Logger(ChildTokenController.name);

  constructor(private readonly childService: ChildService) {}

  @Get()
  async getChildren(
    @TokenInfo() signToken: SignToken,
  ): Promise<ChildResponse[]> {
    const children = await this.childService.findChildByMemberId(
      signToken.memberId,
    );
    return children;
  }

  @Get('/:id')
  async getChildById(
    @TokenInfo() signToken: SignToken,
    @Param('id') id: number,
  ): Promise<ChildResponse | null> {
    const child = await this.childService.findChildByMemberIdAndId(
      signToken.memberId,
      id,
    );
    return child;
  }

  @Post()
  async createChild(
    @TokenInfo() signToken: SignToken,
    @Body() dto: ChildRequestCreate,
  ): Promise<number> {
    this.logger.debug(`createChild.signToken -> ${JSON.stringify(dto)}`);
    const childId = await this.childService.createChild(
      signToken.memberId,
      dto,
    );
    return childId;
  }

  @Patch('/:id')
  async updateChild(
    @TokenInfo() signToken: SignToken,
    @Param('id') id: number,
    @Body() dto: ChildRequestCreate,
  ): Promise<number> {
    this.logger.debug(`updateChild.signToken -> ${JSON.stringify(dto)}`);
    const childId = await this.childService.updateChildById(
      id,
      signToken.memberId,
      dto,
    );
    return childId;
  }

  @Delete('/:id')
  async deleteChild(@Param('id') id: number): Promise<number> {
    const childId = await this.childService.deleteChildById(id);
    return childId;
  }
}
