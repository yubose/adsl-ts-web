import * as u from '@jsmanifest/utils'
import isComponent from './utils/isComponent'
import * as t from './types'
import cache from './_cache'

export default function createPlugin(
  location:
    | t.Plugin.Location
    | t.Plugin.ComponentObject
    | t.NuiComponent.Instance = 'head',
  obj?: t.NuiComponent.Instance | t.Plugin.ComponentObject,
) {
  let _location = '' as t.Plugin.Location
  let _path = (isComponent(obj) ? obj.blueprint?.path : obj?.path) || ''

  if (u.isStr(location)) {
    _location = location
  } else {
    obj = location
    _path = location.blueprint?.path || ''
    const type = location?.type
    if (_path.endsWith('.css')) _location = 'head'
    else if (_path.endsWith('.html')) _location = 'body-top'
    // else if (type === 'plugin') _location = 'head'
    else if (type === 'pluginHead') _location = 'head'
    else if (type === 'pluginBodyTop') _location = 'body-top'
    else if (type === 'pluginBodyTail') _location = 'body-bottom'
    !_location && (_location = 'head')
  }

  const id = _path
  const plugin = {
    id,
    content: '',
    initiated: false,
    location: _location,
    path: _path,
  } as t.Plugin.Object

  if (!_path) {
    _path = ''
    plugin.id = ''
    plugin.path = ''
  }

  !cache.plugin.has(id) && cache.plugin.add(_location, plugin)
  return plugin
}
