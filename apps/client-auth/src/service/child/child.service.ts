import { ExceptionService } from '@app/exception/service/exception.service';
import { ChildRepository } from '@app/persistence/schema/main/repository/child.repository';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChildRequestCreate } from 'dto/interface/child/request/child.request.create.dto';
import { ChildResponse } from 'dto/interface/child/response/child.response.dto';

@Injectable()
export class ChildService {
  constructor(
    private readonly configService: ConfigService,
    private readonly exceptionService: ExceptionService,
    private readonly childRepository: ChildRepository,
  ) {}

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

  async findChildByMemberId(memberId: number): Promise<ChildResponse[]> {
    const result = await this.childRepository.selectChildByMemberId(memberId);

    const children: ChildResponse[] = [];

    if (!result) this.exceptionService.notRecognizedError();
    if (!result?.isSucceed || !result.data) return children;

    for (const child of result.data) {
      children.push(
        new ChildResponse(
          child.id,
          child.memberId,
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
