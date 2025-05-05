import { Test, TestingModule } from '@nestjs/testing';
import { CommunicationSecurityController } from './communication-security.controller';
import { CommunicationSecurityService } from './communication-security.service';

describe('CommunicationSecurityController', () => {
  let communicationSecurityController: CommunicationSecurityController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CommunicationSecurityController],
      providers: [CommunicationSecurityService],
    }).compile();

    communicationSecurityController = app.get<CommunicationSecurityController>(CommunicationSecurityController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(communicationSecurityController.getHello()).toBe('Hello World!');
    });
  });
});
