import { Test, TestingModule } from '@nestjs/testing';
import { ChildTokenController } from './child.token.controller';

describe('ChildTokenController', () => {
  let controller: ChildTokenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChildTokenController],
    }).compile();

    controller = module.get<ChildTokenController>(ChildTokenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
