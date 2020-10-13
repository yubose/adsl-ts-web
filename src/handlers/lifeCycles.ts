import _ from 'lodash'
import {
  ActionChainActionCallbackOptions,
  NOODLActionObject,
  NOODLComponent,
  ResolverConsumerOptions,
} from 'noodl-ui'
import Logger from 'logsnap'

const log = Logger.create('lifeCycles.ts')

function createLifeCycles() {
  const o = {
    onBeforeResolve(
      actions: NOODLActionObject[],
      options: ActionChainActionCallbackOptions,
    ) {
      const logMsg = `%c[onBeforeResolve]`
      const logStyle = `color:#e50087;font-weight:bold;`
      // console.log(logMsg, logStyle, { actions, options })
    },
    async onChainStart(
      actions: NOODLActionObject[],
      options: ActionChainActionCallbackOptions,
    ) {
      log.func('onChainStart')
      log.grey('', { actions, ...options })
      // if (component.get('contentType') === 'file') {
      //   const file = await onSelectFile()
      //   if (file) return { file }
      // }
    },
    onChainEnd(
      actions: NOODLActionObject[],
      options: ActionChainActionCallbackOptions,
    ) {
      const logMsg = `%c[onChainEnd]`
      const logStyle = `color:#e50087;font-weight:bold;`
      console.log(logMsg, logStyle, { actions, ...options })
    },
    onChainError(
      error: Error,
      action: NOODLActionObject,
      options: ActionChainActionCallbackOptions,
    ) {
      const logMsg = `%c[onChainError]`
      const logStyle = `color:#e50087;font-weight:bold;`
      console.log(logMsg, logStyle, { action, error, ...options })
    },
    onChainAborted(
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
    onAfterResolve(
      component: NOODLComponent,
      options: ResolverConsumerOptions,
    ) {
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
