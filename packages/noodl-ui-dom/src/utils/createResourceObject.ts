import * as u from '@jsmanifest/utils'
import { isCssResourceLink, isJsResourceLink } from './internal'
import * as t from '../types'

function createResourceObject<Type extends t.GlobalResourceType>(
  arg: t.UseObjectGlobalResource<Type> | undefined,
): t.GetGlobalResourceObjectAlias<Type> {
  let resourceObject

  if (u.isStr(arg)) {
    if (isCssResourceLink(arg)) {
      resourceObject = { type: 'css', href: arg }
    } else if (isJsResourceLink(arg)) {
      resourceObject = { type: 'js', src: arg }
    }
  } else if (u.isObj(arg)) {
    resourceObject = { ...arg }
  }

  if (resourceObject && !resourceObject.type) {
    if (resourceObject.href) resourceObject.type = 'css'
    else if (resourceObject.src) resourceObject.type = 'js'
  }

  return resourceObject as t.GetGlobalResourceObjectAlias<Type>
}

export default createResourceObject
