import { Providers } from 'dto/enum/provider.enum';

export default function makeMemberProviderKey(
  providerId: Providers,
  idByProvider: string,
): string {
  return `${providerId}.${idByProvider}`;
}
