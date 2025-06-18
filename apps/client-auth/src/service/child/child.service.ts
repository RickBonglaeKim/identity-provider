import { ExceptionService } from '@app/exception/service/exception.service';
import { ChildRepository } from '@app/persistence/schema/main/repository/child.repository';
import { Injectable, Logger } from '@nestjs/common';
import { ChildRequestCreate } from 'dto/interface/child/request/child.request.create.dto';
import { ChildResponse } from 'dto/interface/child/response/child.response.dto';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom, map } from 'rxjs';
import { ArtBonBonChild } from '../../type/service/child.service.type';

@Injectable()
export class ChildService {
  private readonly logger = new Logger(ChildService.name);

  constructor(
    private readonly exceptionService: ExceptionService,
    private readonly childRepository: ChildRepository,
    private readonly httpService: HttpService,
  ) {}

  async getChildrenFromArtBonBon(phoneNumber: string) {
    const { data } = await firstValueFrom(
      this.httpService.get<ArtBonBonChild[]>(
        'https://localhost:3000/test/children',
        {
          params: {
            phoneNumber,
          },
        },
      ),
    );
    this.logger.debug(
      `getChildrenFromArtBonBon.result -> ${JSON.stringify(data)}`,
    );
  }

  async createChild(
    memberId: number,
    data: ChildRequestCreate,
  ): Promise<number> {
    const result = await this.childRepository.insertChild({
      memberId,
      name: data.name,
      birthday: data.birthDay,
      codeGender: data.gender,
    });
    if (!result) this.exceptionService.notRecognizedError();
    if (!result?.isSucceed || !result.data)
      this.exceptionService.notInsertedEntity('child');
    return result!.data!;
  }

  async updateChildById(
    id: number,
    memberId: number,
    data: ChildRequestCreate,
  ): Promise<number> {
    const result = await this.childRepository.updateChildById(id, {
      memberId,
      name: data.name,
      birthday: data.birthDay,
      codeGender: data.gender,
    });
    if (!result) this.exceptionService.notRecognizedError();
    if (!result?.isSucceed || !result.data)
      this.exceptionService.notUpdatedEntity('child');
    return result!.data!;
  }

  async deleteChildById(id: number): Promise<number> {
    const result = await this.childRepository.deleteChildById(id);
    if (!result) this.exceptionService.notRecognizedError();
    if (!result?.isSucceed || !result.data)
      this.exceptionService.notDeletedEntity('child');
    return result!.data!;
  }

  async findChildByMemberIdAndId(
    memberId: number,
    id: number,
  ): Promise<ChildResponse | null> {
    const result = await this.childRepository.selectChildByMemberIdAndId(
      memberId,
      id,
    );
    if (!result) this.exceptionService.notRecognizedError();
    if (!result?.isSucceed) {
      this.exceptionService.notSelectedEntity('child');
    }
    if (!result!.data) return null;
    return new ChildResponse(
      result!.data.id,
      result!.data.createdAt,
      result!.data.name,
      result!.data.birthday,
      result!.data.codeGender,
    );
  }

  async findChildByMemberId(memberId: number): Promise<ChildResponse[]> {
    const result = await this.childRepository.selectChildByMemberId(memberId);

    const children: ChildResponse[] = [];

    if (!result) this.exceptionService.notRecognizedError();
    if (!result?.isSucceed || !result.data) return children;

    for (const child of result.data) {
      children.push(
        new ChildResponse(
          child.id,
          child.createdAt,
          child.name,
          child.birthday,
          child.codeGender,
        ),
      );
    }
    return children;
  }
}
