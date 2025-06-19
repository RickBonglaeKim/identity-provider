import { TransformInterceptor } from '@app/interceptor/transform.interceptor';
import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { SignUpService } from '../../service/sign.up/sign.up.service';
import { SignUpRequestCreate } from 'dto/interface/sign.up/request/sign.up.request.create.dto';
import { SignUpWithPhoneRequestCreate } from 'dto/interface/sign.up/request/phone/sign.up.phone.request.create.dto';
import { OauthService } from '../../service/oauth/oauth.service';
import { Transactional } from '@nestjs-cls/transactional';
import { Passport } from '../../decorator/passport.decorator';
import ERROR_MESSAGE from 'dto/constant/http.error.message.constant';
import SUCCESS_HTTP_STATUS from 'dto/constant/http.status.constant';
import { ChildService } from '../../service/child/child.service';
import { ChildArtBonBonRepository } from '@app/persistence/schema/main/repository/child.art_bonbon.repository';
import { ChildRepository } from '@app/persistence/schema/main/repository/child.repository';

@Controller('signUp')
@UseInterceptors(TransformInterceptor)
export class SignUpController {
  private readonly logger = new Logger(SignUpController.name);

  constructor(
    private readonly signUpService: SignUpService,
    private readonly oauthService: OauthService,
    private readonly childService: ChildService,
    private readonly childRepository: ChildRepository,
    private readonly childArtBonBonRepository: ChildArtBonBonRepository,
  ) {}

  // Not used yet
  @Post()
  @Transactional()
  async postSignUp(
    @Passport() passportKey: string,
    @Res({ passthrough: true }) response: Response,
    @Body() dto: SignUpRequestCreate,
  ): Promise<void | string> {
    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      throw new HttpException(
        ERROR_MESSAGE.PASSPORT_NOT_FOUND,
        HttpStatus.FORBIDDEN,
      );
    }

    const result = await this.signUpService.createSignUpWithoutDuplication(dto);
    if (!result) {
      response.status(SUCCESS_HTTP_STATUS.DATA_DUPLICATED);
      return;
    }

    const memberKey = this.oauthService.createMemberKey({
      memberId: result.memberId,
      memberDetailId: result.memberDetailId,
      passportKey: passportKey,
      timestamp: Date.now(),
    });
    if (!memberKey) {
      throw new HttpException(
        ERROR_MESSAGE.MEMBER_KEY_NOT_CREATED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return memberKey;
  }

  @Post('/phone')
  @Transactional()
  async postSignUpWithPhone(
    @Passport() passportKey: string,
    @Res({ passthrough: true }) response: Response,
    @Body() dto: SignUpWithPhoneRequestCreate,
  ): Promise<void | string> {
    const passport = await this.oauthService.findPassport(passportKey);
    if (!passport) {
      throw new HttpException(
        ERROR_MESSAGE.PASSPORT_NOT_FOUND,
        HttpStatus.FORBIDDEN,
      );
    }

    const result = await this.signUpService.createSignUpWithPhone(dto);
    if (!result) {
      response.status(SUCCESS_HTTP_STATUS.DATA_DUPLICATED);
      return;
    }

    const memberKey = this.oauthService.createMemberKey({
      memberId: result.memberId,
      memberDetailId: result.memberDetailId,
      passportKey: passportKey,
      timestamp: Date.now(),
    });
    if (!memberKey) {
      throw new HttpException(
        ERROR_MESSAGE.MEMBER_KEY_NOT_CREATED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    //--------------------------------------------------------------------------------//
    // Get children from ArtBonBon
    //--------------------------------------------------------------------------------//
    try {
      this.logger.debug(
        `postSignUpWithPhone.dto.memberPhone.phoneNumber -> ${dto.memberPhone.phoneNumber}`,
      );
      const artBonBonResponse =
        await this.childService.getChildrenFromArtBonBon(
          `0${dto.memberPhone.phoneNumber}`,
        );
      if (artBonBonResponse.result.length > 0) {
        for (const child of artBonBonResponse.result) {
          const childId = await this.childService.createChild(result.memberId, {
            name: child.name,
            birthDay: child.birthday,
            gender: child.gender,
          });
          await this.childArtBonBonRepository.insertChildArtBonBon({
            childId: childId,
            artBonbonStudentId: child.id,
          });
        }
      } else {
        if (process.env.NODE_ENV !== 'prod') {
          // Create test children, if no children from ArtBonBon
          await this.childService.createChild(result.memberId, {
            name: '테스트 아들',
            birthDay: '2020-01-01',
            gender: 'GENDER.MALE',
          });
          await this.childService.createChild(result.memberId, {
            name: '테스트 딸',
            birthDay: '2020-01-01',
            gender: 'GENDER.FEMALE',
          });
        }
      }
    } catch (error) {
      this.logger.error(error);
    }
    //--------------------------------------------------------------------------------//
    return memberKey;
  }
}
