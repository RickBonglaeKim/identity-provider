import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import { SigninCreateRequest } from 'dto/interface/sign.in/sign.in.create.request.dto';
import {
  Controller,
  UseInterceptors,
  Logger,
  Get,
  Query,
} from '@nestjs/common';
import { SigninService } from '../../service/sign.in/sign.in.service';

@Controller('signin')
@UseInterceptors(TransformInterceptor)
export class SignInController {
  private readonly logger = new Logger(SignInController.name);

  constructor(private readonly signinService: SigninService) {}

  @Get()
  async signin(@Query() dto: SigninCreateRequest): Promise<void> {
    const result = await this.signinService.findMember(dto.email, dto.password);
  }
}
