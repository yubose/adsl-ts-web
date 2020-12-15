import _ from 'lodash'
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
    _.pick(
      noodlui.getConsumerOptions({
        // Create a dummy component to avoid unexpected data type errors
        component: createComponent('view'),
        getAssetsUrl: (() => noodlui.assetsUrl).bind(noodlui),
        getPageObject: noodlui.getPageObject.bind(noodlui),
        getState: noodlui.getState.bind(noodlui),
        plugins: noodlui.plugins.bind(noodlui),
        setPlugin: noodlui.setPlugin.bind(noodlui),
      }),
      ['component', 'getCbs', 'getResolvers', 'getRoot', 'page', 'viewport'],
    ),
  ) as ActionConsumerCallbackOptions
}

export default getActionConsumerOptions
