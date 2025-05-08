import { Test, TestingModule } from '@nestjs/testing';
import { MemberPhoneService } from './member.phone.service';

describe('MemberPhoneService', () => {
  let service: MemberPhoneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MemberPhoneService],
    }).compile();

    service = module.get<MemberPhoneService>(MemberPhoneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
