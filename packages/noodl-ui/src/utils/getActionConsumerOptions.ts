import pick from 'lodash/pick'
import { ActionConsumerCallbackOptions } from '../types'
import createComponent from '../utils/createComponent'
import NOODLUI from '../noodl-ui'

/**
 * A helper to generate action callback options for consumers. Intended
 * to be exported for use
 * @param { NOODLUI } noodlui - noodl-ui client
 */
function getActionConsumerOptions(
  noodlui: NOODLUI,
): ActionConsumerCallbackOptions {
  return Object.assign(
    {},
    pick(
      noodlui.getConsumerOptions({
        // Create a dummy component to avoid unexpected data type errors
        component: createComponent('view'),
      }),
      ['component', 'getCbs', 'getResolvers', 'getRoot', 'page', 'viewport'],
    ),
    {
      componentCache: noodlui.componentCache.bind(noodlui),
      getAssetsUrl: (() => noodlui.assetsUrl).bind(noodlui),
      getPageObject: noodlui.getPageObject.bind(noodlui),
      getState: noodlui.getState.bind(noodlui),
      plugins: noodlui.plugins.bind(noodlui),
      setPlugin: noodlui.setPlugin.bind(noodlui),
    },
  ) as ActionConsumerCallbackOptions
}

export default getActionConsumerOptions
