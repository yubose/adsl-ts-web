import * as u from '@jsmanifest/utils'
import { GlobalResourceRecord } from '../global'
import * as t from '../types'

const resourceFactory = function () {
  function isCssLink(s: string) {
    return s.endsWith('.css')
  }

  function isJsLink(s: string) {
    return s.endsWith('.js')
  }

  function getTypeByUrl(url = ''): t.GlobalResourceType | '' {
    return isCssLink(url) ? 'css' : isJsLink(url) ? 'js' : ''
  }

  function getIdKeyByType(type: t.GlobalResourceType): 'href' | 'src' | '' {
    switch (type) {
      case 'css':
        return 'href'
      case 'js':
        return 'src'
      default:
        return ''
    }
  }

  function _createObject<T extends t.GlobalResourceType>(
    arg: string | (t.GetGlobalResourceObjectAlias<T> & Record<string, any>),
  ) {
    const resourceObject = {} as
      | t.GlobalCssResourceObject
      | t.GlobalJsResourceObject
      | Record<string, any>

    if (u.isStr(arg)) {
      const resourceType = getTypeByUrl(arg)
      const idKey = getIdKeyByType(resourceType as t.GlobalResourceType)
      const resourceObject = {
        type: resourceType,
        [idKey]: arg,
      } as t.GetGlobalResourceObjectAlias<T>
      return resourceObject
    } else if (u.isObj(arg)) {
      u.assign(resourceObject, arg)
    }

    if (resourceObject && !resourceObject.type) {
      if (resourceObject.href) resourceObject.type = 'css'
      else if (resourceObject.src) resourceObject.type = 'js'
    }
  }

  function _createRecord<T extends t.GlobalResourceType>(
    obj: t.GetGlobalResourceObjectAlias<T>,
  ): GlobalResourceRecord<T> {
    if ('href' in obj) return new GlobalResourceRecord('css', obj.href)
    if ('src' in obj) return new GlobalResourceRecord('js', obj.src)
    return null
  }

  const r = _createRecord({ type: 'css', href: '' })

  return {
    createResourceObject: _createObject,
    createResourceRecord: _createRecord,
  }
}

export default resourceFactory
