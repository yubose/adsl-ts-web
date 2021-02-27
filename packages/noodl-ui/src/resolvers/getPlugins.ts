import { isPluginComponent } from 'noodl-utils'
import { ConsumerOptions, PluginObject, ResolverFn } from '../types'
import { isPromise } from '../utils/common'
import { resolveAssetUrl } from '../utils/noodl'

const getPlugins = (function (): ResolverFn {
  /**
   * Returns true if a plugin with the same path was previously loaded
   * @param { string } path - The image path
   * @param { function } plugins - Plugin getter
   */
  const pluginExists = (path: string, plugins: ConsumerOptions['plugins']) =>
    typeof path === 'string' &&
    plugins('head')
      .concat(plugins('body-top').concat(plugins('body-bottom')))
      .some((obj) => obj.path === path && obj.initiated)

  /**
   * Resolves the path, returning the final url
   * @param { string } path - Image path
   * @param { string } assetsUrl - Assets url
   * @param { function } createSrc
   */
  const getPluginUrl = async (
    path: string,
    assetsUrl: string,
    createSrc: ConsumerOptions['createSrc'],
  ) => {
    let url = createSrc(path)
    if (isPromise(url)) {
      const finalizedUrl = await url
      url = resolveAssetUrl(finalizedUrl, assetsUrl)
    }
    return url
  }

  return (component, { createSrc, fetch, getAssetsUrl, plugins }) => {
    if (isPluginComponent(component)) {
      const path = component.get('path') || ''
      const plugin = (component.get('plugin') as PluginObject) || {}

      if (fetch === undefined && typeof window !== undefined) {
        fetch = window.fetch
      }

      if (pluginExists(path as string, plugins)) return

      let src: string

      getPluginUrl(path, getAssetsUrl(), createSrc)
        .then((result) => {
          src = result
          component.set('src', src).emit('path', src)
          // Use the default fetcher for now
          if (src) return fetch?.(src)
        })
        .then((content) => {
          plugin.content = content
          component
            .set('content', plugin.content)
            .emit('plugin:content', plugin.content)
        })
        // .catch((err) => console.error(`[${err.name}]: ${err.message}`, err))
        .finally(() => (plugin.initiated = true))
    }
  }
})()

export default getPlugins
