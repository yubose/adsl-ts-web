import _ from 'lodash'
import Logger from 'logsnap'
import { isPluginComponent } from 'noodl-utils'
import { PluginObject, ResolverFn } from '../types'
import { isPromise } from '../utils/common'
import { resolveAssetUrl } from '../utils/noodl'

const log = Logger.create('getPlugins')

const getPlugins: ResolverFn = (
  component,
  { createSrc, fetch, getAssetsUrl, plugins },
) => {
  if (isPluginComponent(component)) {
    const path = component.get('path') || ''
    if (typeof path === 'string') {
      const exists = plugins('head')
        .concat(plugins('body-top').concat(plugins('body-bottom')))
        .some((obj) => obj.path === path && obj.initiated)
      if (exists) {
        log.grey(`Skipped a duplicate call to "${component.get('path')}"`, {
          component,
          path,
          plugins: plugins(),
        })
        return
      }
    }
    // Resolves the path, returning the final url
    const getPluginSrc = async (path: string) => {
      let url = createSrc(path)
      if (isPromise(url)) {
        const finalizedUrl = await url
        url = resolveAssetUrl(finalizedUrl, getAssetsUrl())
      }
      return url
    }

    let src: string
    const plugin = component.get('plugin') as PluginObject

    // Only load the plugin if it doesn't have its contents yet
    getPluginSrc(component.get('path'))
      .then((result) => {
        src = result
        component.set('src', src).emit('path', src)
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
          log.red(`Received empty content for plugin "${plugin.path}"`, plugin)
        }
      })
      .catch((err) => {
        console.error(`[${err.name}]: ${err.message}`)
      })
      .finally(() => {
        plugin.initiated = true
      })
  }
}

export default getPlugins
