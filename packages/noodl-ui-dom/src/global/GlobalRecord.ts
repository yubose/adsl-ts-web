import { IGlobalObject } from '../types'

class GlobalRecord<T extends string> implements IGlobalObject<T> {
  type: T
}

export default GlobalRecord
