import * as nt from 'noodl-types'
import {
  PluginBodyTailComponentObject,
  PluginComponentObject,
  PluginHeadComponentObject,
} from 'noodl-types'
import App from '../App'

const createPlugins = function _createPluginHandlers(app: App) {
  const plugins = [] as (
    | PluginComponentObject
    | PluginHeadComponentObject
    | PluginBodyTailComponentObject
  )[]

  const config = app.noodl.config as nt.RootConfig

  config.headPlugin &&
    plugins.push({ type: 'pluginHead', path: config.headPlugin })

  config.bodyTopPplugin &&
    plugins.push({ type: 'pluginBodyTop' as any, path: config.bodyTopPplugin })

  config.bodyTailPplugin &&
    plugins.push({ type: 'pluginBodyTail', path: config.bodyTailPplugin })

  return plugins
}

export default createPlugins
