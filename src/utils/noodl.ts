import { Account } from '@aitmed/cadl'

/**
 * Wrapper around the original Account.requestVerificationCode
 * needed for cypress to remove the read-only attribute so it can be stubbed
 * @param { string } phoneNumber - Phone number
 */
export async function requestVerificationCode(phoneNumber: string) {
  const result = await Account.requestVerificationCode(phoneNumber)
  return result
}
