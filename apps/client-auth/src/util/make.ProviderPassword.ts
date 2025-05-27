import { Providers } from 'dto/enum/provider.enum';

export default function makeProviderPassword(
  providerId: Providers,
  idByProvider: string,
): string {
  return `${providerId}.${idByProvider}`;
}
