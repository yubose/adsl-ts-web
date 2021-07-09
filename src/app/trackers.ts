import App from '../App'

const trackProperty = function trackProperty({
  category = '',
  value: ref,
  subject,
  key: keyProp,
  color: colorProp = 'grey',
}: any) {
  const getArgs = (args: any[]) => (args.length >= 2 ? args : args[0])
  const label = `[${keyProp}]`
  function value(...args: any[]) {
    const type = (args as any).type || args?.[0]?.type || ''
    // This is spamming the console
    if (type !== 'EDIT_DRAFT') {
      console.log(
        `%c${category ? `[${category}]` : ''}${label}`,
        `color:${colorProp};`,
        getArgs(args),
      )
      if (type === 'SET_ROOT_PROPERTIES') {
        // if (args[0]?.payload?.properties?.Global) debugger
      }
    }
    return ref(...args)
  }
  Object.defineProperty(subject, keyProp, {
    configurable: true,
    enumerable: true,
    get: () => value,
  })
}

export const trackSdk = function trackSdk(app: App) {
  const keysToTrack = [
    'addValue',
    'dispatch',
    'defaultObject',
    'editListDraft',
    'emitCall',
    'getApiCache',
    'getData',
    'getPage',
    'handleEvalArray',
    'handleEvalAssignmentExpressions',
    'handleEvalCommands',
    'handleEvalFunction',
    'handleEvalObject',
    'handleEvalString',
    'handleIfCommand',
    'initCallQueue',
    'newDispatch',
    'processPopulate',
    'removeValue',
    'replaceValue',
    'setFromLocalStorage',
    'setValue',
    'updateObject',
  ] as const

  for (const key of keysToTrack) {
    if (!app.noodl?.[key]) continue
    const value = app.noodl?.[key]?.bind?.(app.noodl)
    trackProperty({
      category: 'sdk',
      value,
      key,
      subject: app.noodl,
      color: '#1B76CD',
    })
  }
}

export const trackWebApp = function trackWebApp(app: App) {
  const keysToTrack = [
    'aspectRatio',
    'authStatus',
    'currentPage',
    'previousPage',
    'startPage',
    'viewport',
    'navigate',
    'initialize',
    'getRoomParticipants',
    'getSdkParticipants',
    'setSdkParticipants',
  ] as (keyof App)[]

  for (const key of keysToTrack) {
    if (typeof app[key] !== 'function') continue
    const value = (app[key] as any)?.bind(app)
    trackProperty({
      category: 'web',
      value,
      key,
      subject: app,
      color: '#A335D6',
    })
  }
}
