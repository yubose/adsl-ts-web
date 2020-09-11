import _ from 'lodash'
import {
  ActionChainActionCallbackOptions,
  NOODLChainActionObject,
  NOODLComponent,
  ResolverConsumerOptions,
} from 'noodl-ui'

export function onBeforeResolve(
  actions: NOODLChainActionObject[],
  options: ActionChainActionCallbackOptions,
) {
  const logMsg = `%c[onBeforeResolve]`
  const logStyle = `color:#e50087;font-weight:bold;`
  console.log(logMsg, logStyle, { actions, options })
}

export function onChainStart(
  actions: NOODLChainActionObject[],
  options: ActionChainActionCallbackOptions,
) {
  const logMsg = `%c[onChainStart]`
  const logStyle = `color:#e50087;font-weight:bold;`
  console.log(logMsg, logStyle, { actions, options })
}

export function onChainEnd(
  actions: NOODLChainActionObject[],
  options: ActionChainActionCallbackOptions,
) {
  const logMsg = `%c[onChainEnd]`
  const logStyle = `color:#e50087;font-weight:bold;`
  console.log(logMsg, logStyle, { actions, ...options })
}

export function onChainError(
  error: Error,
  action: NOODLChainActionObject,
  options: ActionChainActionCallbackOptions,
) {
  const logMsg = `%c[onChainError]`
  const logStyle = `color:#e50087;font-weight:bold;`
  console.log(logMsg, logStyle, { action, error, ...options })
}

export function onChainAborted(
  action: NOODLChainActionObject,
  options: ActionChainActionCallbackOptions,
) {
  const logMsg = `%c[onChainAborted]`
  const logStyle = `color:#e50087;font-weight:bold;`
  console.log(logMsg, logStyle, { action, ...options })
}

// Custom component resolver to injecting additional props only to certain components
export function onAfterResolve(
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
}
