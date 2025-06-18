import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import * as cryptoJS from 'crypto-js';
import { AuthorizationTokenCacheRepository } from '@app/cache/repository/authorization.token.cache.repository';
import { ConfigService } from '@nestjs/config';
import { SignToken } from '../type/service/sign.service.type';

declare module 'express' {
  interface Request {
    signToken: SignToken;
  }
}

@Injectable()
export class TokenGuard implements CanActivate {
  private readonly logger = new Logger(TokenGuard.name);
  private readonly signTokenEncryptionKey: string;

  constructor(
    private readonly authorizationTokenCacheRepository: AuthorizationTokenCacheRepository,
    private readonly configService: ConfigService,
  ) {
    this.signTokenEncryptionKey = this.configService.getOrThrow<string>(
      'SIGN_TOKEN_ENCRYPTION_KEY',
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<Request>();
      const { authorization } = request.headers;
      if (!authorization) {
        throw new Error('The authorization header does not exist.');
      }
      this.logger.debug(
        `TokenGuard.canActivate.authorization -> ${authorization}`,
      );
      const token = authorization.replace('Bearer ', '');
      const signToken = cryptoJS.AES.decrypt(
        token,
        this.signTokenEncryptionKey,
      ).toString(cryptoJS.enc.Utf8);
      this.logger.debug(`TokenGuard.canActivate.signToken -> ${signToken}`);

      const { memberId, memberDetailId, timestamp, nonce } = JSON.parse(
        signToken,
      ) as SignToken;

      const key = this.authorizationTokenCacheRepository.createKey(
        memberId,
        memberDetailId,
      );
      const tokenData =
        await this.authorizationTokenCacheRepository.getAccessToken(key);
      if (!tokenData || !tokenData.data) {
        throw new Error('The access token does not exist.');
      }
      if (tokenData.data !== token) {
        throw new Error('The access token does not match.');
      }

      request.signToken = {
        memberId,
        memberDetailId,
        timestamp,
        nonce,
      };

      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`TokenGuard.canActivate.error -> ${message}`);
      throw new HttpException(message, HttpStatus.UNAUTHORIZED);
    }
  }
}
