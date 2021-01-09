import Logger from 'logsnap'
import isNil from 'lodash/isNil'
import { ConsumerOptions } from '../../types'
import { _resolveChildren } from './helpers'
import { event as eventId } from '../../constants'
import { InternalResolver } from '../../Resolver'
import Page from '../../components/Page'
import Viewport from './../../Viewport'

const log = Logger.create('handlePage')

const handlePageInternalResolver = async (
  component: Page,
  options: ConsumerOptions,
  ref: Parameters<InternalResolver['resolve']>[2],
) => {
  try {
    const {
      componentCache,
      context,
      createActionChainHandler,
      createSrc,
      getAssetsUrl,
      getBaseStyles,
      getBaseUrl,
      getCbs,
      getPageObject,
      getResolvers,
      getState,
      plugins,
      resolveComponent,
      resolveComponentDeep,
      setPlugin,
      spawn,
      viewport: mainViewport,
    } = options

    const newPageRefFns = getCbs(eventId.NEW_PAGE_REF)
    const numNewPageRefFns = newPageRefFns?.length
    log.grey(
      `[type: page] Retrieved ${numNewPageRefFns} page funcs`,
      newPageRefFns,
    )

    const viewport = new Viewport()

    viewport.width = isNil(component.style?.width)
      ? mainViewport.width
      : Number(String(component.style.width).replace('px', ''))

    viewport.height = isNil(component.style?.height)
      ? mainViewport.height
      : Number(String(component.style.height).replace('px', ''))

    log.grey(`[type: page] Initiated viewport`, {
      mainViewport,
      component,
      refViewport: viewport,
    })

    const path = component.get('path') as string
    // const ref = component.setRef(spawn(path, { viewport })).getRef() as any
    component.viewport = viewport

    log.grey(`[type: page] Spawned a new noodl-ui process`, {
      // ref,
      path,
      component,
    })

    component.actionsContext = {
      ...context.actionsContext,
      noodlui: component,
    }
    component.assetsUrl = context.assetsUrl
    component.componentCache = componentCache.bind(component)
    component.createActionChainHandler = createActionChainHandler.bind(
      component,
    )
    component.createSrc = createSrc.bind(component)
    component.getAssetsUrl = getAssetsUrl.bind(component)
    component.getBaseStyles = getBaseStyles.bind(component)
    component.getBaseUrl = getBaseUrl.bind(component)
    component.getContext = ref.getContext.bind(component)
    component.getPageObject = ref.getPageObject.bind(component)
    component.getStateHelpers = ref.getStateHelpers.bind(component)
    component.getConsumerOptions = ref.getConsumerOptions.bind(component)
    component.getResolvers = getResolvers.bind(component)
    component.getState = getState.bind(component)
    component.getStateGetters = ref.getStateGetters.bind(component)
    component.getStateSetters = ref.getStateSetters.bind(component)
    component.resolveComponents = ref.resolveComponents.bind(component)
    component.plugins = plugins.bind(component)
    component.use = ref.use.bind(ref)
    component.unuse = ref.unuse.bind(ref)
    window.p = component

    // Note: We leave the builtins/actions/resolvers to be re-attached delegated
    // to the consumer, but the rest should automatically be handled by this lib
    for (let index = 0; index < numNewPageRefFns; index++) {
      const fn = newPageRefFns[index]
      let result = fn?.(component as Page) as Promise<any>
      if (
        (typeof result === 'function' || typeof result === 'object') &&
        typeof result['then'] === 'function'
      ) {
        result = await result
      }
    }

    // setTimeout(() => component.emit(eventId.component.page.SET_REF, ))

    // log.grey(`Ref set on component`, { component, path, })

    const pageObject = getPageObject(path)

    if (pageObject) {
      log.gold('Page object grabbed', { component, pageObject })
    } else if (!pageObject) {
      log.red(`Expected a page object but received ${typeof pageObject}`, {
        component,
        pageObject,
        path,
      })
    }

    const noodlComponents = pageObject?.components || []

    // Setting a timeout allows this call to run after consumers attach
    // listeners to this component, which will allow them to catch this
    // event when attaching listeners
    setTimeout(() =>
      component.emit(
        eventId.component.page.COMPONENTS_RECEIVED,
        noodlComponents,
      ),
    )

    const resolvedComponents = ref.resolveComponents(noodlComponents)

    // Set the parent/child references to stay in sync
    ;(Array.isArray(resolvedComponents)
      ? resolvedComponents
      : [resolvedComponents]
    ).forEach((c) => {
      component.createChild(c)
      c?.setParent?.(component)
    })

    setTimeout(() =>
      component.emit(
        eventId.component.page.RESOLVED_COMPONENTS,
        resolvedComponents,
      ),
    )

    log.gold('resolvedComponents', {
      component,
      noodlComponents,
      ref,
      resolvedComponents,
    })

    if (!Array.isArray(noodlComponents) || !noodlComponents?.length) {
      component.emit(eventId.component.page.MISSING_COMPONENTS, {
        component,
        path: component.get('path') as string,
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
    console.error(error)
    throw new Error(error)
  }
}

export default handlePageInternalResolver
