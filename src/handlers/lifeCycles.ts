import _ from 'lodash'
import {
  ActionChainActionCallbackOptions,
  ActionChainEventId,
  NOODLActionObject,
  NOODLComponent,
  ConsumerOptions,
} from 'noodl-ui'
import Logger from 'logsnap'

const log = Logger.create('lifeCycles.ts')

function createLifeCycles() {
  const o: Record<ActionChainEventId, ActionChainActionCallbackOptions> = {
    beforeResolve(actions, options) {
      const logMsg = `%c[onBeforeResolve]`
      const logStyle = `color:#e50087;font-weight:bold;`
      // console.log(logMsg, logStyle, { actions, options })
    },
    async chainStart(
      actions: NOODLActionObject[],
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
      actions: NOODLActionObject[],
      options: ActionChainActionCallbackOptions,
    ) {
      const logMsg = `%c[onChainEnd]`
      const logStyle = `color:#e50087;font-weight:bold;`
      console.log(logMsg, logStyle, { actions, ...options })
    },
    chainError(
      error: Error,
      action: NOODLActionObject,
      options: ActionChainActionCallbackOptions,
    ) {
      const logMsg = `%c[onChainError]`
      const logStyle = `color:#e50087;font-weight:bold;`
      console.log(logMsg, logStyle, { action, error, ...options })
    },
    chainAborted(
      action: NOODLActionObject,
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
  } as Record<ActionChainEventId, ActionChainActionCallbackOptions>

  return o as Record<ActionChainEventId, ActionChainActionCallbackOptions>
}

export default createLifeCycles
