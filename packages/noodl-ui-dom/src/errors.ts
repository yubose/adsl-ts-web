import { errorCode } from './constants'

export class RequestError extends Error {
  code: typeof errorCode[keyof typeof errorCode]['code']
  name = 'RequestError'

  constructor(message: string, code: RequestError['code']) {
    super(message)
    this.code = code

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RequestError)
    }
  }
}
