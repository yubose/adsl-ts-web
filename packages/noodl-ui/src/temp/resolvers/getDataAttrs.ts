import { ComponentObject } from 'noodl-types'
import {
  createEmitDataKey,
  excludeIteratorVar,
  findDataValue,
  isEmitObj,
} from 'noodl-utils'
import EmitAction from '../../Action/EmitAction'
import { isPromise } from '../../utils/common'
import { findListDataObject } from '../../utils/noodl'
import { ResolverFn } from '../../types'

export default {
  name: 'getDataAttrs',
  resolve(component: ComponentObject) {},
}
