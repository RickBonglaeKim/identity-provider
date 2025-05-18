export default function trimPhoneNumber(phoneNumber: string): string {
  if (phoneNumber.startsWith('0')) return phoneNumber.substring(1);
  return phoneNumber;
}
