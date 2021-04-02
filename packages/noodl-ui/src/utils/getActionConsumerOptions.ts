import pick from 'lodash/pick'
import Page from '../components/Page'
import isComponent from './isComponent'

/**
 * A helper to generate action callback options for consumers. Intended
 * to be exported for use
 * @param { NOODLUI } instance - noodl-ui client or Page component
 */
function getActionConsumerOptions(instance: any | Page): any {
  return Object.assign(
    {},
    pick(
      instance.getConsumerOptions({
        // Create a dummy component to avoid unexpected data type errors
        component: {} as any,
      }),
      ['component', 'getCbs', 'getResolvers', 'getRoot', 'page', 'viewport'],
    ),
    {
      componentCache: instance.componentCache.bind(instance),
      getAssetsUrl: (() => instance.assetsUrl).bind(instance),
      getPageObject: instance.getPageObject.bind(instance),
      getState: instance.getState.bind(instance),
      plugins: instance.plugins?.bind(instance),
    },
    isComponent(instance)
      ? undefined
      : { setPlugin: instance.setPlugin?.bind(instance) },
  ) as ActionConsumerCallbackOptions
}

export default getActionConsumerOptions
