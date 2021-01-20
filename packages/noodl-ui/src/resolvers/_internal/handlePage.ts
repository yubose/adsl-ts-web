import Logger from 'logsnap'
import { ConsumerOptions } from '../../types'
import { _resolveChildren } from './helpers'
import { event as eventId } from '../../constants'
import Page from '../../components/Page'
import Viewport from './../../Viewport'
import createComponent from '../../utils/createComponent'

const log = Logger.create('handlePage')

const handlePageInternalResolver = async (
  component: Page,
  options: ConsumerOptions,
  { _internalResolver, ref }: any, // ref === noodl-ui instance
) => {
  try {
    const {
      context,
      getAssetsUrl,
      getBaseUrl,
      getCbs,
      getPageObject,
      getPages,
      getPreloadPages,
      getRoot,
      getState,
      plugins,
      viewport: mainViewport,
    } = options

    const newPageRefFns = getCbs(eventId.NEW_PAGE_REF)
    const numNewPageRefFns = newPageRefFns?.length
    log.grey(
      `[type: page] Retrieved ${numNewPageRefFns} page funcs`,
      newPageRefFns,
    )

    const viewport = new Viewport()

    if (component.style?.width === undefined) {
      viewport.width = mainViewport.width
    } else {
      viewport.width = Number(String(component.style?.width).replace('px', ''))
    }

    if (component.style?.height === undefined) {
      viewport.height = mainViewport.height
    } else {
      viewport.height = Number(
        String(component?.style?.height).replace('px', ''),
      )
    }

    const path = component.get('path') as string
    component.viewport = viewport

    component.assetsUrl = getAssetsUrl()
    component.getState = getState.bind(component)
    component.plugins = plugins.bind(component)
    component.use({
      getAssetsUrl: () => getAssetsUrl(),
      getBaseUrl: () => getBaseUrl(),
      getRoot: () => getRoot(),
      getPages: () => getPages(),
      getPreloadPages: () => getPreloadPages(),
    })
    component._internalResolver = _internalResolver
    component.createComponent = createComponent.bind(component)

    Object.entries(context.actionsContext || {}).forEach(([k, v]) => {
      if (k !== 'noodlui') {
        component.use({
          actionsContext: { [k]: v },
        })
      }
    })

    // @ts-expect-error
    if (path === 'GotoViewTag') window.p = component

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

    const resolvedComponents = component.resolveComponents(noodlComponents)

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
