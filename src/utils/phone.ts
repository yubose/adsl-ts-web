import {
  AsYouType,
  CountryCode,
  isValidNumberForRegion,
} from 'libphonenumber-js'

export async function formatPhoneNumber({
  phoneNumber,
  countryCode,
}: {
  phoneNumber: string
  countryCode: CountryCode
}): Promise<string> {
  const asYouType = new AsYouType(countryCode)
  await asYouType.input(phoneNumber)
  const result = await asYouType.getNumber()
  if (!result) return ''
  const { countryCallingCode, nationalNumber } = result
  return `+${countryCallingCode} ${nationalNumber}`
}

export async function isValidPhoneNumber({
  phoneNumber,
  countryCode,
}: {
  phoneNumber: string
  countryCode: CountryCode
}): Promise<boolean> {
  return isValidNumberForRegion(phoneNumber, countryCode)
}
