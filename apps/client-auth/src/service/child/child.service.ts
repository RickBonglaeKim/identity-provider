import { ExceptionService } from '@app/exception/service/exception.service';
import { ChildRepository } from '@app/persistence/schema/main/repository/child.repository';
import { Injectable, Logger } from '@nestjs/common';
import { ChildRequestCreate } from 'dto/interface/child/request/child.request.create.dto';
import { ChildResponse } from 'dto/interface/child/response/child.response.dto';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom, map } from 'rxjs';
import { ArtBonBonResponse } from '../../type/service/child.service.type';

@Injectable()
export class ChildService {
  private readonly logger = new Logger(ChildService.name);

  constructor(
    private readonly exceptionService: ExceptionService,
    private readonly childRepository: ChildRepository,
    private readonly httpService: HttpService,
  ) {}

  async getChildrenFromArtBonBon(phone: string): Promise<ArtBonBonResponse> {
    const { data } = await firstValueFrom(
      this.httpService.get<ArtBonBonResponse>(
        'https://capi-dev.art-bonbon.com/v2/user/students',
        {
          params: { phone },
          headers: {
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTc1MDMxMDM5Nzg2Mywic2VydmljZU5hbWUiOiJpZHAiLCJpYXQiOjE3NTAzMTAzOTd9.-pHh76kGpLm_CgfxQib0DEBEl1vKYFvPTi5LRTibCnw`,
          },
        },
      ),
    );

    this.logger.debug(
      `getChildrenFromArtBonBon.data -> ${JSON.stringify(data)}`,
    );
    return data;
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
    const result =
      await this.childRepository.selectChildByMemberIdAndIdWithChildArtBonBon(
        memberId,
        id,
      );
    if (!result) this.exceptionService.notRecognizedError();
    if (!result?.isSucceed) {
      this.exceptionService.notSelectedEntity('child');
    }
    if (!result!.data) return null;
    return new ChildResponse(
      result!.data.child.id,
      result!.data.child.createdAt,
      result!.data.child.name,
      result!.data.child.birthday,
      result!.data.child.codeGender,
      result!.data.childArtBonbon?.artBonbonStudentId || null,
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
          child.child.id,
          child.child.createdAt,
          child.child.name,
          child.child.birthday,
          child.child.codeGender,
          child.childArtBonbon?.artBonbonStudentId || null,
        ),
      );
    }
    return children;
  }
}
