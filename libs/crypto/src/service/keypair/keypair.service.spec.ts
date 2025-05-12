import { Test, TestingModule } from '@nestjs/testing';
import { KeypairService } from './keypair.service';

describe('KeypairService', () => {
  let service: KeypairService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KeypairService],
    }).compile();

    service = module.get<KeypairService>(KeypairService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
