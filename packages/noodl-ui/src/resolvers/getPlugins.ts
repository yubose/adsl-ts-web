import _ from 'lodash'
import Logger from 'logsnap'
import { isPluginComponent } from 'noodl-utils'
import { PluginObject, ResolverFn } from '../types'
import { isPromise } from '../utils/common'
import { resolveAssetUrl } from '../utils/noodl'

const log = Logger.create('getPlugins')

const getPlugins: ResolverFn = (
  component,
  { createSrc, fetch, getAssetsUrl },
) => {
  if (isPluginComponent(component)) {
    // Resolves the path, returning the final url
    const getPluginSrc = async (path: string) => {
      let url = createSrc(path)
      if (isPromise(url)) {
        const finalizedUrl = await url
        url = resolveAssetUrl(finalizedUrl, getAssetsUrl())
      } else {
      }
      return url
    }

    let src: string
    const plugin = component.get('plugin') as PluginObject

    // Only load the plugin if it doesn't have its contents yet
    if (!plugin.content0) {
      getPluginSrc(component.get('path'))
        .then((result) => {
          src = createSrc(result)
          component.set('src', createSrc(src))
          // Use the default fetcher for now
          if (src) return fetch(src)
        })
        .then((content) => {
          plugin.content = content
          if (plugin.content) {
            log.grey('Received plugin content', {
              src,
              content: plugin.content,
            })
            component
              .set('content', plugin.content)
              .emit('plugin:content', plugin.content)
          } else {
            log.red(
              `Received empty content for plugin "${plugin.path}"`,
              plugin,
            )
          }
        })
        .catch((err) => {
          console.error(`[${err.name}]: ${err.message}`)
        })
    }
  }
}

export default getPlugins
