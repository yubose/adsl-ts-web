import _ from 'lodash'
import Logger from 'logsnap'
import { isPluginComponent } from 'noodl-utils'
import Component from '../components/Base'
import { EmitObject, Fetch, PluginObject, ResolverFn } from '../types'
import { isPromise } from '../utils/common'
import { getPluginTypeLocation, resolveAssetUrl } from '../utils/noodl'

const log = Logger.create('getPlugins')

const getPlugins: ResolverFn = (
  component,
  { createSrc, fetch, getAssetsUrl, plugins, setPlugin },
) => {
  if (isPluginComponent(component)) {
    /**
     * Creates and returns a new plugin object
     * @param { Component } component
     */
    const getPluginObject = (component: Component) => {
      let plugin: PluginObject | undefined
      let loc = getPluginTypeLocation(component.noodlType)
      if (loc === 'head') {
        plugin = { location: 'head' }
      } else if (loc === 'body-top') {
        plugin = { location: 'body-top' }
      } else if (loc === 'body-bottom') {
        plugin = { location: 'body-bottom' }
      }
      return plugin as PluginObject
    }

    // Resolves the path, returning the final url
    const getPluginPath = async (path: EmitObject | string) => {
      let url = createSrc(path)
      log.grey(`Received the url from component path: ${url}`, {
        component,
        url,
      })
      if (isPromise(url)) {
        log.grey(`URL is a promise`, { component, url })
        const finalizedUrl = await url
        log.grey(`Received plugin url from promise`, {
          component,
          finalizedUrl,
          url,
        })
        url = resolveAssetUrl(finalizedUrl, getAssetsUrl())
        log.grey(`Promise url resolved to: ${url}`, component)
      } else {
        log.grey(`URL is a string`, { component, url })
      }
      return url
    }

    log.grey(`Encountered a plugin component`, component)

    let src: string
    const plugin = setPlugin(getPluginObject(component))

    getPluginPath(component.get('path'))
      .then((result) => {
        src = result
        plugin.url = src
        component.set('src', src)
        // Use the default fetcher for now
        if (src) return fetch(src)
      })
      .then((content) => {
        console.info('Received plugin content', { src, content })
        component.set('content', content)
        plugin.content = content as any
        return plugin
      })
      .catch((err) => {
        console.error(`[${err.name}]: ${err.message}`)
      })
      .finally(() => {
        log.grey(`Promise ended from getPluginPath`, component)

        // Set the plugin object to the noodl-ui client for global access

        if (component.noodlType === 'pluginHead') {
          component.set('location', 'head')
        } else if (component.noodlType === 'pluginBodyTop') {
          component.set('location', 'body-top')
        } else if (component.noodlType === 'pluginBodyTail') {
          component.set('location', 'body-bottom')
        }
      })
  }
}

export default getPlugins
