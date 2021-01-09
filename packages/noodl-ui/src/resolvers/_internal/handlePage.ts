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
    } = options

    const newPageRefFns = getCbs(eventId.NEW_PAGE_REF)
    const numNewPageRefFns = newPageRefFns.length
    log.grey(
      `[type: page] Retrieved ${numNewPageRefFns} page funcs`,
      newPageRefFns,
    )
    const path = component.get('path') || ''
    log.grey(`[type: page] Path is "${path}"`)
    const viewport = new Viewport()
    viewport.width = Number(component.style.width?.replace('px', ''))
    viewport.height = Number(component.style.height?.replace('px', ''))
    log.grey(`[type: page] Initiated viewport`, component)
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
      let result = fn?.(ref) as Promise<any>
      if (
        (typeof result === 'function' || typeof result === 'object') &&
        typeof result['then'] === 'function'
      ) {
        result = await result
      }
    }

    component.set('ref', ref)
    component.emit(eventId.component.page.SET_REF, ref)

    log.grey(`Ref set on component`, { component, path, ref })
    log.gold(component.style.width)
    log.gold(component.style.height)

    const pageObject = getPageObject(path)

    if (pageObject) {
      log.gold('Page object grabbed', { component, pageObject, ref })
    } else if (!pageObject) {
      log.red(`Expected a page object but received ${typeof pageObject}`, {
        component,
        pageObject,
        path,
        ref,
      })
    }

    const noodlComponents = pageObject?.components || []

    component.emit(eventId.component.page.COMPONENTS_RECEIVED, noodlComponents)

    const resolvedComponents = ref.resolveComponents(noodlComponents)

    // Set the parent/child references to stay in sync
    ;(Array.isArray(resolvedComponents)
      ? resolvedComponents
      : [resolvedComponents]
    ).forEach((c) => {
      component.createChild(c)
      c?.setParent?.(component)
    })

    component.emit(
      eventId.component.page.RESOLVED_COMPONENTS,
      resolvedComponents,
    )

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
