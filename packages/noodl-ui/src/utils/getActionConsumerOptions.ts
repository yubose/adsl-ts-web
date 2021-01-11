import pick from 'lodash/pick'
import { ActionConsumerCallbackOptions } from '../types'
import NOODLUI from '../noodl-ui'

/**
 * A helper to generate action callback options for consumers. Intended
 * to be exported for use
 * @param { NOODLUI } instance - noodl-ui client or Page component
 */
function getActionConsumerOptions(
  instance: NOODLUI,
): ActionConsumerCallbackOptions {
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
      plugins: instance.plugins.bind(instance),
      setPlugin: instance.setPlugin?.bind(instance),
    },
  ) as ActionConsumerCallbackOptions
}

export default getActionConsumerOptions
