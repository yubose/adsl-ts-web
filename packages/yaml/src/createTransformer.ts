import y from 'yaml'
// import _emit from './transformers/emit'
// import _eval from './transformers/eval'
import _if from './transformers/if'
import _merge from './transformers/merge'
import _replace from './transformers/replace'
import { Kind, MapKind, ScalarKind, SeqKind, StringKind } from './constants'
import * as t from './types'

function createTransformer() {
  return function transform(value: unknown) {
    if (y.isScalar(value)) {
      //
    }
  }
}

export default createTransformer
