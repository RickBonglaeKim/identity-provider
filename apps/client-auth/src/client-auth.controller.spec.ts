import { Test, TestingModule } from '@nestjs/testing';
import { ClientAuthController } from './client-auth.controller';
import { ClientAuthService } from './client-auth.service';

describe('ClientAuthController', () => {
  let clientAuthController: ClientAuthController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ClientAuthController],
      providers: [ClientAuthService],
    }).compile();

    clientAuthController = app.get<ClientAuthController>(ClientAuthController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(clientAuthController.getHello()).toBe('Hello World!');
    });
  });
});
