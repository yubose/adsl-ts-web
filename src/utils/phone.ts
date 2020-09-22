export async function formatPhoneNumber({
  phoneNumber,
  countryCode,
}: {
  phoneNumber: string
  countryCode: string
}): Promise<string> {
  return `${countryCode} ${phoneNumber}`
}

export async function isValidPhoneNumber({
  phoneNumber,
  countryCode,
}: {
  phoneNumber: string
  countryCode: any
}): Promise<boolean> {
  // return isValidNumberForRegion(phoneNumber, countryCode)
  return true
}
