import * as u from '@jsmanifest/utils'
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
    const payload = (args as any).payload || args?.[0]?.payload || ''
    if (
      // These are unnecessarily spamming the console
      ![
        'ADD_BUILTIN_FNS',
        'EDIT_DRAFT',
        'SET_ROOT_PROPERTIES',
        'SET_LOCAL_PROPERTIES',
        'add-fn',
        'populate',
        'set-api-buffer',
        'update-localStorage',
        'update-map',
      ].includes(type)
    ) {
      if (type === 'SET_VALUE') {
        if (
          [payload?.value, payload?.fn, payload?.update].some((o) => u.isFnc(o))
        ) {
          return ref(...args)
        }
      }
      console.log(
        `%c${category ? `[${category}]` : ''}${label}`,
        `color:${colorProp};`,
        getArgs(args),
      )
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
    'dispatch',
    'emitCall',
    'handleEvalFunction',
    'handleEvalObject',
    'handleEvalString',
    'newDispatch',
    'setFromLocalStorage',
    'updateObject',
    'set-api-buffer',
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
    // 'aspectRatio',
    // 'authStatus',
    // 'currentPage',
    // 'previousPage',
    // 'startPage',
    // 'viewport',
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
