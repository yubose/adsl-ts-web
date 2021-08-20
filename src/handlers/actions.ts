import * as u from '@jsmanifest/utils'
import Logger from 'logsnap'
import omit from 'lodash/omit'
import has from 'lodash/has'
import get from 'lodash/get'
import set from 'lodash/set'
import {
  asHtmlElement,
  eventId as ndomEventId,
  findWindow,
  findByElementId,
  findByViewTag,
  findByDataAttrib,
  findByUX,
  isPageConsumer,
  Page as NDOMPage,
  SignaturePad,
  getFirstByDataKey,
} from 'noodl-ui-dom'
import {
  ConsumerOptions,
  EmitAction,
  findListDataObject,
  findIteratorVar,
  getActionObjectErrors,
  isComponent,
  NUITrigger,
  parseReference,
  Page as NUIPage,
  Store,
  triggers,
} from 'noodl-ui'
import {
  evalIf,
  isRootDataKey,
  ParsedPageComponentUrlObject,
} from 'noodl-utils'
import { IfObject, Identify } from 'noodl-types'
import {
  getBlobFromCanvas,
  getVcodeElem,
  hide,
  show,
  openFileSelector,
  scrollToElem,
  toast,
} from '../utils/dom'
import App from '../App'
import { getRandomKey, pickActionKey, pickHasActionKey } from '../utils/common'
import * as T from '../app/types'

const log = Logger.create('actions.ts')
const _pick = pickActionKey
const _has = pickHasActionKey

const createActions = function createActions(app: App) {
  const pickNUIPageFromOptions = (options: ConsumerOptions) =>
    (app.pickNUIPage(options.page) || app.mainPage.getNuiPage()) as NUIPage

  const pickNDOMPageFromOptions = (options: ConsumerOptions) =>
    (app.pickNDOMPage(options.page) || app.mainPage) as NDOMPage

  const emit = triggers.reduce(
    (
      acc: Partial<Record<NUITrigger, Store.ActionObject<'emit'>['fn']>>,
      trigger,
    ) =>
      u.assign(acc, {
        [trigger]: async function (
          action: EmitAction,
          options: ConsumerOptions,
        ) {
          try {
            log.func(`emit [${trigger}]`)
            log.grey('', action?.snapshot?.())

            const emitParams = {
              actions: _pick(action, 'actions'),
              pageName:
                pickNUIPageFromOptions(options)?.page || app.currentPage,
            } as T.EmitCallParams

            if (_has(_pick(action, 'emit'), 'dataKey')) {
              const dataKeyValue = _pick(action, 'dataKey')
              emitParams.dataKey = dataKeyValue
              if (dataKeyValue == undefined) {
                log.red(
                  `An undefined value was set for "dataKey" as arguments to emitCall`,
                  { action: action?.snapshot?.(), emitParams },
                )
              }
            }

            log.grey('Emitting', {
              action: action?.snapshot?.(),
              emitParams,
              options,
            })
            const emitResult = u.array(
              await app.noodl.emitCall(emitParams as any),
            )
            log.grey(`Emitted`, {
              action: action?.snapshot?.(),
              emitParams,
              emitResult,
            })

            return u.isArr(emitResult)
              ? emitResult.length > 1
                ? emitResult
                : emitResult?.[0]
              : [emitResult]
          } catch (error) {
            console.error(error)
          }
        },
      }),
    {},
  )

  const anonymous: Store.ActionObject['fn'] = async (a) => {
    log.func('anonymous')
    log.grey('', a.snapshot())
  }

  const evalObject: Store.ActionObject['fn'] = async function onEvalObject(
    action,
    options,
  ) {
    log.func('evalObject')
    log.grey('', {
      action: action?.snapshot?.(),
      actionChain: options?.ref?.snapshot?.(),
      options,
    })

    try {
      let object = _pick(action, 'object') as
        | IfObject
        | ((...args: any[]) => any)

      if (u.isFnc(object)) {
        const result = await object()
        if (result) {
          const { ref: actionChain } = options
          if (u.isObj(result)) {
            getActionObjectErrors(result).forEach((errMsg: string) =>
              log.red(errMsg, result),
            )
            if (result.abort) {
              log.grey(
                `An evalObject returned an object with abort: true. The action chain ` +
                  `will no longer proceed`,
                { actionChain, injectedObject: result },
              )
              if (actionChain) {
                // There is a bug with global popups not being able to be visible because of this abort block.
                // For now until a better solution is implemented we can do a check here
                for (const action of actionChain.queue) {
                  const popUpView = _pick(action, 'popUpView')
                  if (popUpView) {
                    if (app.ndom.global.components.has(popUpView)) {
                      log.salmon(
                        `An "abort: true" was injected from evalObject but a global component ` +
                          `with popUpView "${popUpView}" was found. These popUp actions will ` +
                          `still be called to ensure the behavior persists for global popUps`,
                        {
                          globalObject:
                            app.ndom.global.components.get(popUpView),
                        },
                      )
                      await action?.execute()
                    }
                  }
                }
                await actionChain.abort(
                  `An evalObject is requesting to abort using the "abort" key`,
                )
              }
            } else {
              const isPossiblyAction = 'actionType' in result
              const isPossiblyToastMsg = 'message' in result
              const isPossiblyGoto = 'goto' in result || 'destination' in result

              if (isPossiblyAction || isPossiblyToastMsg || isPossiblyGoto) {
                log.grey(
                  `An evalObject action is injecting a new object to the chain`,
                  {
                    actionChain,
                    instance: actionChain?.inject.call(
                      actionChain,
                      result as any,
                    ),
                    object: result,
                    queue: actionChain?.queue.slice(),
                  },
                )
              }
            }
          }
        }
      } else if (_has(object, 'if')) {
        const ifObj = object
        if (u.isArr(ifObj)) {
          const pageName = pickNUIPageFromOptions(options)?.page || ''
          object = evalIf((valEvaluating) => {
            let value
            if (Identify.isBoolean(valEvaluating)) {
              return Identify.isBooleanTrue(valEvaluating)
            }
            if (u.isStr(valEvaluating)) {
              if (valEvaluating.includes('.')) {
                if (has(app.root, valEvaluating)) {
                  value = get(app.root, valEvaluating)
                } else if (has(app.root[pageName], valEvaluating)) {
                  value = get(app.root[pageName], valEvaluating)
                }
              }
              if (Identify.isBoolean(value)) Identify.isBooleanTrue(value)
            }
            return !!value
          }, ifObj)
          if (u.isFnc(object)) {
            const result = await object()
            if (result) {
              log.hotpink(
                `Received a value from evalObject's "if" evaluation. ` +
                  `Returning it back to the action chain now`,
                { action: action?.snapshot?.(), result },
              )
              return result
            }
          }
        }
      }
    } catch (error) {
      console.error(error)
      toast(error.message, { type: 'error' })
    }
  }

  const goto: Store.ActionObject['fn'] = async function onGoto(
    action,
    options,
  ) {
    let goto = _pick(action, 'goto') || ''
    let ndomPage = pickNDOMPageFromOptions(options)
    let destProps: ReturnType<typeof app.parse.destination>

    log.func('goto')
    log.grey(
      _pick(action, 'goto'),
      u.isObj(action) ? action?.snapshot?.() : action,
    )

    let destinationParam =
      (u.isStr(goto)
        ? goto
        : u.isObj(goto)
        ? goto.destination || goto.dataIn?.destination || goto
        : '') || ''

    destProps = app.parse.destination(destinationParam)

    let { destination, id = '', isSamePage, duration } = destProps

    let pageModifiers = {} as any

    if (destination === destinationParam) {
      ndomPage.requesting = destination
    }

    if ('targetPage' in destProps) {
      // @ts-expect-error
      const destObj = destProps as ParsedPageComponentUrlObject
      destination = destObj.targetPage || ''
      id = destObj.viewTag || ''
      if (id) {
        for (const obj of app.cache.component) {
          if (obj) {
            if (obj?.component?.blueprint?.id === id) {
              const pageComponent = obj.component
              const currentPageName = pageComponent?.get?.('path')
              ndomPage = app.ndom.findPage(currentPageName) as NDOMPage
              break
            }
          }
        }
      }
    }

    if (u.isObj(goto?.dataIn)) {
      const dataIn = goto.dataIn
      'reload' in dataIn && (pageModifiers.reload = dataIn.reload)
      'pageReload' in dataIn && (pageModifiers.pageReload = dataIn.pageReload)
    }

    if (id) {
      const isInsidePageComponent =
        isPageConsumer(options.component) || !!destProps.targetPage
      const node = findByViewTag(id) || findByElementId(id)
      if (node) {
        let win: Window | undefined | null
        let doc: Document | null | undefined
        if (document.contains?.(node as any)) {
          win = window
          doc = window.document
        } else {
          win = findWindow((w) => {
            if (!w) return false
            return (
              'contentDocument' in w ? w['contentDocument'] : w.document
            )?.contains?.(node as HTMLElement)
          })
        }
        function scroll() {
          if (isInsidePageComponent) {
            scrollToElem(node, { win, doc, duration })
          } else {
            ;(node as HTMLElement)?.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'center',
            })
          }
        }
        if (isSamePage) scroll()
        else;
        ndomPage.once(ndomEventId.page.on.ON_COMPONENTS_RENDERED, scroll)
      } else {
        log.red(`Could not search for a DOM node with an identity of "${id}"`, {
          id,
          destination,
          isSamePage,
          duration,
          action: action?.snapshot?.(),
        })
      }
    }

    if (!destinationParam.startsWith('http')) {
      // Avoids letting page components (lower level components) from mutating the tab's url
      if (ndomPage === app.mainPage) {
        ndomPage.pageUrl = app.parse.queryString({
          destination,
          pageUrl: ndomPage.pageUrl,
          startPage: app.startPage,
        })
        log.grey(`Page URL evaluates to: ${ndomPage.pageUrl}`)
      } else {
        // TODO - Move this to an official location in noodl-ui-dom
        if (
          ndomPage.rootNode &&
          ndomPage.rootNode instanceof HTMLIFrameElement
        ) {
          if (ndomPage.rootNode.contentDocument?.body) {
            ndomPage.rootNode.contentDocument.body.textContent = ''
          }
        }
      }
    } else {
      destination = destinationParam
    }

    log.grey(`Goto info`, {
      gotoObject: { goto },
      destinationParam,
      isSamePage,
      pageModifiers,
      updatedQueryString: ndomPage?.pageUrl,
    })

    if (!isSamePage) {
      if (
        ndomPage?.rootNode &&
        ndomPage.rootNode instanceof HTMLIFrameElement
      ) {
        if (ndomPage.rootNode.contentDocument?.body) {
          ndomPage.rootNode.contentDocument.body.textContent = ''
        }
      }

      await app.navigate(ndomPage, destination)
      if (!destination) {
        log.func('goto')
        log.red(
          'Tried to go to a page but could not find information on the whereabouts',
          { action: action?.snapshot?.(), options },
        )
      }
    }
  }

  const _getInjectBlob: (name: string) => Store.ActionObject['fn'] = (name) =>
    async function getInjectBlob(action, options) {
      log.func(name)
      log.gold('', action?.snapshot?.())
      const result = await openFileSelector()
      log.func(name)
      switch (result.status) {
        case 'selected':
          const { files } = result
          const ac = options?.ref
          const comp = options?.component
          const dataKey = _pick(action, 'dataKey')
          if (ac && comp) {
            ac.data.set(dataKey, files?.[0])
            if (u.isStr(dataKey)) {
              app.updateRoot(dataKey, ac.data.get(dataKey))
            } else {
              log.red(
                `Could not write file to dataKey because it was not a string. Received "${typeof dataKey}" instead`,
              )
            }
            log.green(`Selected file for dataKey "${dataKey}"`, {
              file: files?.[0],
              actionChain: ac,
            })
          } else {
            log.red(
              `%cBoth action and component is needed to inject a blob to the action chain`,
              `color:#ec0000;`,
              {
                action: action?.snapshot?.(),
                actionChain: ac,
                component: comp,
                dataKey,
              },
            )
          }
          break
        case 'canceled':
          await options?.ref?.abort?.('File input window was closed')
          return log.red(
            `File was not selected for action "${name}" and the operation was aborted`,
            action?.snapshot?.(),
          )
        case 'error':
          return void log.red(`An error occurred for action "${name}"`, {
            action: action?.snapshot?.(),
            ...result,
          })
      }
    }

  // These 3 funcs are only for android, so we can ignore these since this
  // behavior is handled in updateObject
  const openCamera = _getInjectBlob('openCamera')
  const openDocumentManager = _getInjectBlob('openDocumentManager')
  const openPhotoLibrary = _getInjectBlob('openPhotoLibrary')

  const pageJump: Store.ActionObject['fn'] = (action) =>
    app.navigate(_pick(action, 'destination'))

  const popUp: Store.ActionObject['fn'] = async function onPopUp(
    action,
    options,
  ) {
    log.func('popUp')
    log.grey('', action?.snapshot?.())
    const { ref } = options
    const dismissOnTouchOutside = _pick(action, 'dismissOnTouchOutside')
    const popUpView = _pick(action, 'popUpView')
    u.arrayEach(asHtmlElement(findByUX(popUpView)), (elem) => {
      if (dismissOnTouchOutside) {
        const onTouchOutside = function onTouchOutside(
          this: HTMLDivElement,
          e: Event,
        ) {
          e.preventDefault()
          hide(elem)
          document.body.removeEventListener('click', onTouchOutside)
        }
        document.body.addEventListener('click', onTouchOutside)
      }
      if (elem?.style) {
        if (Identify.action.popUp(action)) show(elem)
        else if (Identify.action.popUpDismiss(action)) hide(elem)
        // Some popup components render values using the dataKey. There is a bug
        // where an action returns a popUp action from an evalObject action. At
        // this moment the popup is not aware that it needs to read the dataKey if
        // it is not triggered by some NOODLDOMDataValueElement. So we need to do a check here

        // Auto prefills the verification code when ECOS_ENV === 'test'
        // and when the entered phone number starts with 888
        if (process.env.ECOS_ENV === 'test') {
          const currentPage =
            pickNUIPageFromOptions(options)?.page || app.currentPage
          const vcodeInput = getVcodeElem()
          const phoneInput = u.array(
            asHtmlElement(findByDataAttrib('data-name', 'phoneNumber')),
          )[0] as HTMLInputElement
          let phoneNumber = String(
            phoneInput?.value || phoneInput?.dataset?.value,
          )
          if (!phoneNumber && phoneInput?.dataset?.key) {
            const value = get(app.root[currentPage], phoneInput.dataset.key)
            value && (phoneNumber = value)
          }
          const is888 =
            phoneNumber.startsWith('888') ||
            phoneNumber.startsWith('+1888') ||
            phoneNumber.startsWith('+1 888')

          if (vcodeInput && is888 && action?.actionType !== 'popUpDismiss') {
            let pathToTage = 'verificationCode.response.edge.tage'
            let vcode = get(app.root?.[currentPage], pathToTage, '')
            if (vcode) {
              vcode = String(vcode)
              vcodeInput.value = vcode
              vcodeInput.dataset.value = vcode
              app.updateRoot(
                `${currentPage}.${vcodeInput.dataset.key || 'formData.code'}`,
                vcode,
              )
            } else {
              log.orange(
                `Could not find a verification code at path "${pathToTage}"`,
              )
            }
          }
        }

        // If popUp has wait: true, the action chain should pause until a response
        // is received from something (ex: waiting on user confirming their password)
        if (Identify.isBooleanTrue(_pick(action, 'wait'))) {
          log.grey(
            `Popup action for popUpView "${popUpView}" is ` +
              `waiting on a response. Aborting now...`,
            action?.snapshot?.(),
          )
          ref?.abort?.()
        }
      } else {
        let msg = `Tried to ${action?.actionType === 'popUp' ? 'show' : 'hide'}`
        log.func(action?.actionType)
        log.red(
          `${msg} a ${action?.actionType} element but the element ` +
            `was null or undefined`,
          { action: action?.snapshot?.(), popUpView },
        )
        debugger
      }
    })
  }

  const popUpDismiss: Store.ActionObject['fn'] = async function onPopUpDismiss(
    action,
    options,
  ) {
    log.func('popUpDismiss')
    log.grey('', action?.snapshot?.())
    for (const obj of app.actions.popUp) {
      await (obj as Store.ActionObject)?.fn?.(action, options)
    }
  }

  const refresh: Store.ActionObject['fn'] = async function onRefresh(action) {
    log.func('refresh')
    log.grey('', action?.snapshot?.())
    window.location.reload()
  }

  const saveObject: Store.ActionObject['fn'] = async function onSaveObject(
    action,
    options,
  ) {
    log.func('saveObject')
    log.grey('', action?.snapshot?.())

    const { getRoot, ref } = options
    const object = _pick(action, 'object')
    const currentPage = pickNUIPageFromOptions(options)?.page || app.currentPage

    try {
      if (u.isFnc(object)) {
        await object()
      } else if (u.isArr(object)) {
        for (const obj of object) {
          if (u.isArr(obj)) {
            // Assuming this a tuple where the first item is the path to the "name" field
            // and the second item is the actual function that takes in values from using
            // the name field to retrieve values
            if (obj.length === 2) {
              let nameField
              const [nameFieldPath, save] = obj
              if (u.isStr(nameFieldPath) && u.isFnc(save)) {
                if (Identify.reference(nameFieldPath)) {
                  nameField = parseReference(nameFieldPath, {
                    page: currentPage,
                    root: getRoot(),
                  })
                } else {
                  nameField =
                    get(app.root, nameFieldPath, null) ||
                    get(app.root?.[currentPage], nameFieldPath, {})
                }

                const params = { ...nameField }
                'verificationCode' in params && delete params.verificationCode
                await save(params)
                log.func('saveObject')
                log.grey(`Called saveObject with:`, params)
              }
            }
          }
        }
      } else if (u.isStr(object)) {
        log.func('saveObject')
        log.red(
          `The "object" property in the saveObject action is a string which ` +
            `is in the incorrect format. Possibly a parsing error?`,
          action?.snapshot?.(),
        )
      }
    } catch (error) {
      console.error(error)
      toast((error as Error).message, { type: 'error' })
      ref?.abort?.()
    }
  }

  const removeSignature: Store.ActionObject['fn'] =
    async function onRemoveSignature(action, options) {
      try {
        log.func('removeSignature')
        log.grey('', { action: action?.snapshot?.(), options })
        const dataKey = _pick(action, 'dataKey')
        const node = getFirstByDataKey(dataKey) as HTMLCanvasElement
        if (node) {
          const component = app.cache.component.get(node.id)?.component
          if (isComponent(component)) {
            const signaturePad = component.get('signaturePad') as SignaturePad
            if (signaturePad) {
              signaturePad.clear()
              log.grey(
                `Cleared signature for dataKey "${dataKey}"`,
                signaturePad,
              )
            } else {
              log.red(
                `Tried to clear the signature using dataKey "${dataKey}" ` +
                  `but the component did not have the signature pad stored in its instance`,
                component,
              )
            }
          } else {
            log.red(
              `Tried to clear the signature using dataKey "${dataKey}" ` +
                `but the component did not exist in the component cache`,
              { node, component, cachedComponents: app.cache.component.get() },
            )
          }
        }
      } catch (error) {
        toast((error as Error).message, { type: 'error' })
      }
    }

  const saveSignature: Store.ActionObject['fn'] = function onSaveSignature(
    action,
    options,
  ) {
    return new Promise((resolve, reject) => {
      log.func('saveSignature')
      log.grey('', { action: action?.snapshot?.(), options })
      const dataKey = _pick(action, 'dataKey')
      if (dataKey) {
        const node = getFirstByDataKey(dataKey) as HTMLCanvasElement
        const component = app.cache.component.get(node.id)?.component
        if (component) {
          const signaturePad = component.get('signaturePad') as SignaturePad
          if (signaturePad) {
            let dataKey = _pick(action, 'dataKey')
            let dataObject = isRootDataKey(dataKey)
              ? app.root
              : app.root?.[pickNUIPageFromOptions(options)?.page || '']
            let dataUrl = signaturePad.toDataURL()
            let mimeType = dataUrl.split(';')[0].split(':')[1] || ''
            if (has(dataObject, dataKey)) {
              getBlobFromCanvas(node, mimeType).then((blob) => {
                set(dataObject, dataKey, blob)
                log.func('saveSignature')
                log.grey(`Saved blob to "${dataKey}"`, {
                  blob,
                  dataKey,
                  dataObject,
                  mimeType,
                })
                resolve()
              })
            } else {
              resolve(
                log.red(
                  `Cannot save the signature because the component with dataKey "${dataKey}" did not have a SignaturePad stored in its instance`,
                  { action: action?.snapshot?.(), component },
                ),
              )
            }
          } else {
            resolve(
              log.red(`Missing signature pad from a canvas component`, {
                action: action?.snapshot?.(),
                component,
              }),
            )
          }
        } else {
          resolve(
            log.red(
              `Cannot save the signature because a component with dataKey "${dataKey}" was not available in the component cache`,
              { action: action?.snapshot?.(), component },
            ),
          )
        }
      } else {
        resolve(
          log.red(
            `Cannot save the signature because there is no dataKey`,
            action?.snapshot?.(),
          ),
        )
      }
    })
  }

  const toastAction: Store.ActionObject['fn'] = async function onToast(action) {
    try {
      log.func('toast')
      log.gold('', action?.snapshot?.())
      toast(_pick(action, 'message') || '')
    } catch (error) {
      error instanceof Error && toast(error.message, { type: 'error' })
    }
  }

  const updateObject: Store.ActionObject['fn'] = async function onUpdateObject(
    action,
    { component, ref },
  ) {
    log.func('updateObject')
    log.grey('', action?.snapshot?.())

    let file: File | undefined

    try {
      if (_pick(action, 'dataObject') === 'BLOB') {
        const dataKey = _pick(action, 'dataKey') || ''
        if (ref) {
          if (ref.data.has(dataKey)) {
            file = ref.data.get(dataKey)
          } else {
            log.orange(
              `No blob was found for dataKey "${dataKey}" on the action chain. ` +
                `Opening the file selector...`,
            )
            const { files, status } = await openFileSelector()
            if (status === 'selected') {
              file = files?.[0]
              ref.data.set(dataKey, file)
              log.green(`Selected file`, file)
            }
          }
        } else {
          log.red(
            `Action chain does not exist. No blob will be available`,
            action?.snapshot?.(),
          )
        }
      }

      let object: any

      // This is the more older version of the updateObject action object where it used
      // the "object" property
      if (_has(action, 'object')) object = _pick(action, 'object')
      // This is the more newer version that is more descriptive, utilizing the data key
      // action = { actionType: 'updateObject', dataKey, dataObject }
      else if (_pick(action, 'dataKey') || _pick(action, 'dataObject')) {
        object = omit(action?.original || action, 'actionType')
      }

      if (u.isFnc(object)) {
        const result = await object()
        log.grey(`Invoked "object" that was a function`, { object, result })
      } else if (u.isStr(object)) {
        log.red(
          `A string was received as the "object" property. Possible parsing error?`,
          action?.snapshot?.(),
        )
      } else if (u.isArr(object)) {
        for (const obj of object) u.isFnc(obj) && (await obj())
      } else if (u.isObj(object)) {
        let { dataKey, dataObject } = object
        let iteratorVar = findIteratorVar(component)

        if (u.isStr(dataObject)) {
          if (/(file|blob)/i.test(dataObject)) {
            const name = dataObject
            log.grey(`The data object is requesting a "${name}"`)
            dataObject = file || dataObject
            log.grey(`Attached the "${name}"`, dataObject)
          } else if (dataObject.startsWith(iteratorVar)) {
            dataObject = findListDataObject(component)
            !dataObject && (dataObject = file)
          }
        }

        if (dataObject) {
          const params = { dataKey, dataObject }
          log.func('updateObject')
          log.grey(`Calling updateObject`, { params })
          await app.noodl.updateObject(params)
        } else {
          log.red(`Invalid/empty dataObject`, {
            action: action?.snapshot?.(),
            dataObject,
          })
        }
      }
    } catch (error) {
      console.error(error)
      toast(error.message, { type: 'error' })
    }
  }

  return {
    anonymous,
    emit,
    evalObject,
    goto,
    openCamera,
    openDocumentManager,
    openPhotoLibrary,
    pageJump,
    popUp,
    popUpDismiss,
    refresh,
    removeSignature,
    saveObject,
    saveSignature,
    toast: toastAction,
    updateObject,
  }
}

export default createActions
