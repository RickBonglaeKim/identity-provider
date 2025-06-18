import { Test, TestingModule } from '@nestjs/testing';
import { ChildCookieController } from './child.cookie.controller';

describe('ChildCookieController', () => {
  let controller: ChildCookieController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChildCookieController],
    }).compile();

    controller = module.get<ChildCookieController>(ChildCookieController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
