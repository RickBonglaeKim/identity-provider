import { Genders } from 'dto/enum/gender.enum';

export type ArtBonBonResponse = {
  code: number;
  message: string;
  result: ArtBonBonChild[];
};

export type ArtBonBonChild = {
  id: string;
  name: string;
  birthday: string;
  gender: Genders;
};
