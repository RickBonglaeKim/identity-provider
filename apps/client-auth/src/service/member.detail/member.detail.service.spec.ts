import { Test, TestingModule } from '@nestjs/testing';
import { MemberDetailService } from './member.detail.service';

describe('MemberDetailService', () => {
  let service: MemberDetailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MemberDetailService],
    }).compile();

    service = module.get<MemberDetailService>(MemberDetailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
