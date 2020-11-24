import _ from 'lodash'
import {
  ActionChainCallbackOptions,
  ActionChainActionCallback,
  ActionChainActionCallbackOptions,
  ActionChainEventId,
  ActionObject,
  NOODLComponent,
  ConsumerOptions,
} from 'noodl-ui'
import Logger from 'logsnap'

const log = Logger.create('lifeCycles.ts')

function createLifeCycles() {
  const o: Record<ActionChainEventId, any> = {
    beforeResolve(actions, options) {
      const logMsg = `%c[onBeforeResolve]`
      const logStyle = `color:#e50087;font-weight:bold;`
      // console.log(logMsg, logStyle, { actions, options })
    },
    async chainStart(
      actions: ActionObject[],
      options: ActionChainActionCallbackOptions,
    ) {
      log.func('onChainStart')
      log.grey('onChainStart args', { actions, ...options })
      // if (component.get('contentType') === 'file') {
      //   const file = await onSelectFile()
      //   if (file) return { file }
      // }
    },
    chainEnd(
      actions: ActionObject[],
      options: ActionChainActionCallbackOptions,
    ) {
      const logMsg = `%c[onChainEnd]`
      const logStyle = `color:#e50087;font-weight:bold;`
      console.log(logMsg, logStyle, { actions, ...options })
    },
    chainError(
      error: Error,
      action: ActionObject,
      options: ActionChainActionCallbackOptions,
    ) {
      const logMsg = `%c[onChainError]`
      const logStyle = `color:#e50087;font-weight:bold;`
      console.log(logMsg, logStyle, { action, error, ...options })
    },
    chainAborted(
      action: ActionObject,
      options: ActionChainActionCallbackOptions,
    ) {
      const logMsg = `%c[onChainAborted]`
      const logStyle = `color:#e50087;font-weight:bold;`
      console.log(logMsg, logStyle, { action, ...options })
    },
    /**
     * Custom component resolver to injecting additional props only to
     * certain components
     */
    afterResolve(component: NOODLComponent, options: ConsumerOptions) {
      if (component.contentType === 'password') {
        return {
          noodl: {
            iconPaths: {
              passwordHidden: `${
                options.context?.assetsUrl || ''
              }${'makePasswordInvisible.png'}`,
              passwordVisible: `${
                options.context?.assetsUrl || ''
              }${'makePasswordVisiable.png'}`,
            },
          },
        }
      }
    },
  }

  return o
}

export default createLifeCycles
