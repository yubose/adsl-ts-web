import Logger from 'logsnap'
import { ComponentInstance, ConsumerOptions } from '../../types'
import { _resolveChildren } from './helpers'
import { event as eventId } from '../../constants'
import Resolver from '../../Resolver'
import Viewport from './../../Viewport'

const log = Logger.create('handlePage')

const handlePageInternalResolver = async (
  component: ComponentInstance,
  options: ConsumerOptions,
  _internalResolver: Resolver,
) => {
  try {
    const {
      componentCache,
      getCbs,
      getPageObject,
      resolveComponent,
      resolveComponentDeep,
      spawn,
      viewport: mainViewport,
    } = options

    const newPageFns = getCbs(eventId.NEW_PAGE)
    const numNewPageFns = newPageFns.length
    const newPageRefFns = getCbs(eventId.NEW_PAGE_REF)
    const numNewPageRefFns = newPageRefFns.length
    log.grey(`[type: page] Retrieved ${numNewPageFns} page funcs`, newPageFns)
    const path = component.get('path') || ''
    log.grey(`[type: page] Path is "${path}"`)
    const viewport = new Viewport()
    log.grey(`[type: page] Initiated viewport`)
    const ref = spawn(path, { viewport })

    log.grey(`[type: page] Spawned a new noodl-ui process`, {
      ref,
      path,
      viewport,
      component,
    })

    // Note: We leave the builtins/actions/resolvers to be re-attached delegated
    // to the consumer, but the rest should automatically be handled by this lib
    for (let index = 0; index < numNewPageRefFns; index++) {
      const fn = newPageRefFns[index]
      await fn?.(ref)
    }

    component.set('ref', ref)
    log.grey(`Ref set on component`, { component, ref })
    log.gold(component.style.width)
    log.gold(component.style.height)

    const pageObject = getPageObject(path)

    if (!pageObject) {
      log.red(`Expected a page object but received ${typeof pageObject}`, {
        component,
        pageObject,
        path,
        ref,
      })
    }

    const noodlComponents = pageObject?.components || []

    component.emit(eventId.component.page.COMPONENTS_RECEIVED, noodlComponents)

    const resolvedComponents = resolveComponentDeep(noodlComponents)

    component.emit(eventId.component.page.RESOLVED_COMPONENTS)

    // Set the parent/child references to stay in sync
    ;(Array.isArray(resolvedComponents)
      ? resolvedComponents
      : [resolvedComponents]
    ).forEach((c) => {
      component.createChild(c)
      c?.setParent?.(component)
    })

    log.gold('resolvedComponents', {
      component,
      noodlComponents,
      ref,
      resolvedComponents,
    })

    if (!Array.isArray(noodlComponents) || !noodlComponents.length) {
      component.emit(eventId.component.page.MISSING_COMPONENTS, {
        component,
        path: component.get('path'),
      })
      log.func(eventId.component.page.MISSING_COMPONENTS)
      log.red(
        `Didnt receive any content/components for page ${component.get(
          'path',
        )}`,
        { component, path: component.get('path') },
      )
    }
  } catch (error) {
    throw new Error(error)
  }
}

export default handlePageInternalResolver
