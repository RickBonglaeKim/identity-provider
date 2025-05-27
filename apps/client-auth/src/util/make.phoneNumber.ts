export default function makePhoneNumber(
  countryCallingCode: string,
  phoneNumber: string,
): string {
  return `+${countryCallingCode} ${phoneNumber}`;
}
