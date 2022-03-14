import * as u from '@jsmanifest/utils'
import Logger from 'logsnap'
import { Identify, ReferenceString } from 'noodl-types'
import { trimReference } from 'noodl-utils'
import get from 'lodash/get'
import has from 'lodash/has'
import App from '../App'
import createRegisters from '../handlers/register'

const log = Logger.create(`trackers`)

function validateRef(
  app: App,
  key: string,
  page = app.pendingPage || app.currentPage,
) {
  if (Identify.reference(key)) {
    const datapath = trimReference(key)
    const pathInSplits = datapath.split('.')
    if (Identify.localKey(datapath)) {
      if (!has(app.root?.[page], pathInSplits)) {
        log.red(
          `The reference "${key}" is not found in the local root object for page "${page}"`,
          { datapath, key, page, pathInSplits },
        )
      }
      return get(app.root?.[page], pathInSplits)
    }
    return get(app.root, pathInSplits)
  }
}

const validateObject = (
  app: App,
  obj: Record<string, any>,
  page = app.pendingPage,
) => {
  for (const [key, value] of u.entries(obj)) {
    Identify.reference(key) && validateRef(app, key, page)
    Identify.reference(value) && validateRef(app, value, page)
    if (u.isObj(value)) {
      validateObject(app, value, page)
    }
  }
}

const trackProperty = function trackProperty({
  app,
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
        'eval-object',
        'populate',
        'populate-object',
        'set-api-buffer',
        'set-cache',
        'update-localStorage',
        'update-map',
      ].includes(type)
    ) {
      if (type === 'SET_VALUE') {
        if (u.isNum(payload?.value?.mtime)) {
          // const date = formatDate(
          //   new Date(payload.value.mtime),
          //   'MMM Do, yyyy hh:mm:ss',
          // )
          // console.log(`%cTimestamp/date`, `color:#00b406;`, {
          //   payload,
          //   stampToDay: app.noodl.root.builtIn.date.stampToDate(
          //     payload.value.atime,
          //   ),
          //   stampToDate: app.noodl.root.builtIn.date.stampToDate(
          //     payload.value.atime,
          //   ),
          //   stampToTime: app.noodl.root.builtIn.date.stampToTime(
          //     payload.value.atime,
          //   ),
          // })
        }
        if (
          // Silence the unnecessary logging of adding functions to objects
          [payload?.value, payload?.fn, payload?.update].some((o) => u.isFnc(o))
        ) {
          return ref(...args)
        }
      }

      const combinedArgs = getArgs(args)

      if (keyProp === 'handleEvalFunction') {
        const args = combinedArgs as {
          command: Record<string, any>
          key: string
          pageName: string
        }
        const pageName = args.pageName || app.pendingPage || ''
        const command = args?.command
        if (u.isObj(command)) {
          const keys = u.keys(command)
          if (keys[0].startsWith(`=.builtIn`)) {
            const ref = keys[0] as ReferenceString<`builtIn.${string}`, '=.'>
            const path = trimReference(keys[0] as ReferenceString)
            const fn = get(subject?.root, path)

            if (!u.isFnc(fn)) {
              log.red(`A function is not found for builtIn: "${ref}"`, {
                ref,
                path,
                ...args,
              })
            } else {
              const obj = command[ref]
              if (u.isObj(obj)) {
                for (const dkey of ['dataIn', 'dataOut']) {
                  if (dkey in obj) {
                    const dataInOrOut = obj[dkey]
                    if (
                      u.isStr(dataInOrOut) &&
                      Identify.reference(dataInOrOut)
                    ) {
                      validateRef(app, dataInOrOut, pageName)
                    } else if (u.isArr(dataInOrOut)) {
                      dataInOrOut.forEach((v) =>
                        validateObject(app, v, pageName),
                      )
                    } else if (u.isObj(dataInOrOut)) {
                      for (const [k, v] of u.entries(dataInOrOut)) {
                        if (u.isStr(k) && Identify.reference(k)) {
                          validateRef(app, k, pageName)
                        }
                        if (u.isStr(v) && Identify.reference(v)) {
                          validateRef(app, v, pageName)
                        } else if (u.isArr(v)) {
                          v.forEach((_) => validateObject(app, _, pageName))
                        } else if (u.isObj(v)) {
                          validateObject(app, v, pageName)
                        }
                      }
                    }
                  }
                }
              } else if (u.isArr(obj)) {
                obj.forEach(
                  (v) =>
                    (u.isObj(v) && validateObject(app, v, pageName)) ||
                    (u.isStr(v) &&
                      Identify.reference(v) &&
                      validateRef(app, v, pageName)),
                )
              } else if (u.isStr(obj) && Identify.reference(obj)) {
                validateRef(app, obj, pageName)
              }
            }
          } else {
            validateObject(app, command, pageName)
          }
        }
      }

      if(combinedArgs?.key && combinedArgs?.key?.indexOf('storeCredentials') !== -1){
        let key = combinedArgs?.key
        let datain = combinedArgs?.['command']?.[key]?.['dataIn']
        if(datain?.hasOwnProperty('userId')){
          const registers = createRegisters(app)
          u.forEach(
            (keyVal) => app.nui._experimental?.['register' as any]?.(...keyVal),
            registers,
          )
        }
      }
      console.log(
        `%c${category ? `[${category}]` : ''}${label}`,
        `color:${colorProp};`,
        combinedArgs,
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
    // 'dispatch',
    'emitCall',
    'handleEvalFunction',
    // 'handleEvalObject',
    // 'handleEvalString',
    'newDispatch',
    // 'setFromLocalStorage',
    'updateObject',
    // 'set-api-buffer',
  ] as const

  for (const key of keysToTrack) {
    if (!app.noodl?.[key]) continue
    const value = app.noodl?.[key]?.bind?.(app.noodl)
    trackProperty({
      app,
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
      app,
      category: 'web',
      value,
      key,
      subject: app,
      color: '#A335D6',
    })
  }
}
