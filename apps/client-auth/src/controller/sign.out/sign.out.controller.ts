import {
  Controller,
  Get,
  Logger,
  Req,
  Res,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { OauthService } from '../../service/oauth/oauth.service';
import { CookieHandler } from '../../util/cookie.handler';
import { COOKIE_NAME } from '../../enum/cookie.name.enum';
import ERROR_MESSAGE from 'dto/constant/http.error.message.constant';

@Controller('signout')
export class SignOutController {
  private readonly logger = new Logger(SignOutController.name);

  constructor(
    private readonly oauthService: OauthService,
    private readonly cookieHandler: CookieHandler,
  ) {}

  @Get()
  async getSignout(
    @Req() request: Request,
    @Res() response: Response,
    @Query('return') returnUrl: string,
  ): Promise<void> {
    const signCookie = this.cookieHandler.getCookie(request, COOKIE_NAME.IDP);
    this.logger.debug(`getSignout.signCookie -> ${JSON.stringify(signCookie)}`);
    if (!signCookie) {
      throw new HttpException(
        ERROR_MESSAGE.COOKIE_NOT_FOUND,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const removedResult = await this.oauthService.removeAuthorizationToken(
      signCookie.memberId,
      signCookie.memberDetailId,
    );
    if (!removedResult) {
      this.logger.warn('The authorization token does not exist.');
    }

    this.cookieHandler.removeCookie(response, COOKIE_NAME.IDP);

    if (returnUrl) {
      response.redirect(returnUrl);
    } else {
      response.redirect('/');
      // response.redirect(this.signInUrl);
    }
  }
}
