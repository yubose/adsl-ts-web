import Logger from 'logsnap'
import omit from 'lodash/omit'
import has from 'lodash/has'
import set from 'lodash/set'
import get from 'lodash/get'
import { Draft } from 'immer'
import {
  asHtmlElement,
  eventId as ndomEventId,
  findByUX,
  findWindow,
  findByElementId,
  findByViewTag,
  findByDataAttrib,
  isPageConsumer,
} from 'noodl-ui-dom'
import {
  ConsumerOptions,
  EmitAction,
  findListDataObject,
  findIteratorVar,
  getActionObjectErrors,
  NUITrigger,
  parseReference,
  Store,
  triggers,
} from 'noodl-ui'
import { evalIf, parse } from 'noodl-utils'
import { IfObject, Identify } from 'noodl-types'
import { pageEvent } from '../constants'
import { getVcodeElem, onSelectFile, scrollToElem, toast } from '../utils/dom'
import App from '../App'
import * as T from '../app/types'
import * as u from '../utils/common'

const log = Logger.create('actions.ts')

const createActions = function createActions(app: App) {
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
            log.grey('', action)

            const emitParams = {
              actions: action.actions,
              pageName: app.mainPage.page,
            } as T.EmitCallParams

            if ('dataKey' in (action.original.emit || {})) {
              emitParams.dataKey = action.dataKey
              if (action.dataKey == undefined) {
                log.red(
                  `An undefined value was set for "dataKey" as arguments to emitCall`,
                  { action, emitParams },
                )
              }
            }

            log.grey('Emitting', { action, emitParams, options })
            const emitResult = u.array(
              await app.noodl.emitCall(emitParams as any),
            )
            log.grey(`Emitted`, { emitParams, emitResult })

            return u.isArr(emitResult)
              ? emitResult.length > 1
                ? emitResult
                : emitResult[0]
              : [emitResult]
          } catch (error) {
            console.error(error)
            // toast(error.message, { type: 'error' })
          }
        },
      }),
    {},
  )

  const anonymous: Store.ActionObject['fn'] = async (a) => {
    log.func('anonymous')
    log.grey('', a)
  }

  const evalObject: Store.ActionObject['fn'] = async function onEvalObject(
    action,
    options,
  ) {
    log.func('evalObject')
    log.grey('', action)

    try {
      if (u.isFnc(action?.original?.object)) {
        const result = await action.original.object?.()
        if (result) {
          const { ref: actionChain } = options
          if (u.isObj(result)) {
            getActionObjectErrors(result).forEach((errMsg: string) =>
              log.red(errMsg, result),
            )
            log.grey(
              `An evalObject action is injecting a new object to the chain`,
              {
                actionChain,
                instance: actionChain?.inject.call(actionChain, result as any),
                object: result,
                queue: actionChain?.queue.slice(),
              },
            )
          }
        }
      } else if ('if' in (action.original.object || {})) {
        const ifObj = action.original.object as IfObject
        if (u.isArr(ifObj)) {
          const pageName = app.mainPage.page || ''
          const object = evalIf((valEvaluating) => {
            let value
            if (Identify.isBoolean(valEvaluating)) {
              return Identify.isBooleanTrue(valEvaluating)
            }
            if (u.isStr(valEvaluating)) {
              if (valEvaluating.includes('.')) {
                if (has(app.noodl.root, valEvaluating)) {
                  value = get(app.noodl.root, valEvaluating)
                } else if (has(app.noodl.root[pageName], valEvaluating)) {
                  value = get(app.noodl.root[pageName], valEvaluating)
                }
              }
              if (Identify.isBoolean(value)) {
                return Identify.isBooleanTrue(value)
              }
            }
            return !!value
          }, ifObj)
          if (u.isFnc(object)) {
            const result = await object()
            if (result) {
              log.hotpink(
                `Received a value from evalObject's "if" evaluation. ` +
                  `Returning it back to the action chain now`,
                { action, result },
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
    log.func('goto')
    log.grey(action.original?.goto || action?.goto || 'goto', action)

    let gotoObject = { goto: action.original.goto } as any
    let pageModifiers = {} as any

    const destinationParam =
      (u.isStr(action.original.goto)
        ? action.original.goto
        : u.isObj(action.original.goto)
        ? action.original.goto.destination ||
          action.original.goto.dataIn?.destination ||
          action.original.goto
        : '') || ''

    let { destination, id = '', isSamePage, duration } = parse.destination(
      destinationParam,
    )

    if (destination === destinationParam) {
      app.mainPage.requesting = destination
    }

    if (u.isObj(gotoObject.goto?.dataIn)) {
      const dataIn = gotoObject.goto.dataIn
      'reload' in dataIn && (pageModifiers.reload = dataIn.reload)
      'pageReload' in dataIn && (pageModifiers.pageReload = dataIn.pageReload)
    } else if (u.isObj(gotoObject)) {
      'reload' in gotoObject && (pageModifiers.reload = gotoObject.reload)
      'pageReload' in gotoObject &&
        (pageModifiers.pageReload = gotoObject.pageReload)
    }

    if (id) {
      const isInsidePageComponent = isPageConsumer(options.component)
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
            return ('contentDocument' in w
              ? w['contentDocument']
              : w.document
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
        else
          app.mainPage.once(ndomEventId.page.on.ON_COMPONENTS_RENDERED, scroll)
      } else {
        log.red(`Could not search for a DOM node with an identity of "${id}"`, {
          id,
          destination,
          isSamePage,
          duration,
          action,
        })
      }
    }

    if (!destinationParam.startsWith('http')) {
      app.mainPage.pageUrl = u.resolvePageUrl({
        destination,
        pageUrl: app.mainPage.pageUrl,
        startPage: app.noodl.cadlEndpoint.startPage,
      })
      log.grey(`Page URL evaluates to: ${app.mainPage.pageUrl}`)
    } else {
      destination = destinationParam
    }

    log.grey(`Goto info`, {
      gotoObject,
      destinationParam,
      isSamePage,
      pageModifiers,
      updatedQueryString: app.mainPage.pageUrl,
    })

    if (!isSamePage) {
      await app.navigate(destination)
      if (!destination) {
        log.func('goto')
        log.red(
          'Tried to go to a page but could not find information on the whereabouts',
          { action, options },
        )
      }
    }
  }

  const pageJump: Store.ActionObject['fn'] = (action) =>
    app.navigate(action.original?.destination || '')

  const popUp: Store.ActionObject['fn'] = async function onPopUp(
    action,
    options,
  ) {
    log.func('popUp')
    log.grey('', action)
    const { ref } = options
    const elem = findByUX(action.original.popUpView) as HTMLElement
    const popUpView = action.original.popUpView || ''
    if (action.original.dismissOnTouchOutside) {
      const onTouchOutside = function onTouchOutside(
        this: HTMLDivElement,
        e: Event,
      ) {
        e.preventDefault()
        elem.style.visibility = 'hidden'
        document.body.removeEventListener('click', onTouchOutside)
      }
      document.body.addEventListener('click', onTouchOutside)
    }
    if (elem?.style) {
      if (action.actionType === 'popUp') {
        elem.style.visibility = 'visible'
      } else if (action.actionType === 'popUpDismiss') {
        elem.style.visibility = 'hidden'
      }
      // Some popup components render values using the dataKey. There is a bug
      // where an action returns a popUp action from an evalObject action. At
      // this moment the popup is not aware that it needs to read the dataKey if
      // it is not triggered by some NOODLDOMDataValueElement. So we need to do a check here

      // Auto prefills the verification code when ECOS_ENV === 'test'
      // and when the entered phone number starts with 888
      if (process.env.ECOS_ENV === 'test') {
        const vcodeInput = getVcodeElem()
        const phoneInput = u.array(
          asHtmlElement(findByDataAttrib('data-name', 'phoneNumber')),
        )[0] as HTMLInputElement
        const phoneNumber = String(
          phoneInput?.value || phoneInput?.dataset?.value,
        )
        if (
          vcodeInput &&
          (phoneNumber.startsWith('888') ||
            phoneNumber.startsWith('+1888') ||
            phoneNumber.startsWith('+1 888'))
        ) {
          const pageName = app.mainPage?.page || ''
          const pathToTage = 'verificationCode.response.edge.tage'
          let vcode = get(app.noodl.root?.[pageName], pathToTage, '')

          if (!pageName) {
            log.red(
              `Could not determine the page to query the verification code for`,
            )
          }

          if (vcode) {
            if (!vcodeInput.value || vcodeInput.value == '0') {
              vcode = String(vcode)
              vcodeInput.value = vcode
              vcodeInput.dataset.value = vcode
              app.noodl.editDraft((draft: Draft<Record<string, any>>) => {
                set(
                  draft[pageName],
                  vcodeInput.dataset.key || 'formData.code',
                  vcode,
                )
              })
            }
          } else {
            log.orange(
              `Could not find a verification code at path "${pathToTage}"`,
            )
          }
        }
      }

      // If popUp has wait: true, the action chain should pause until a response
      // is received from something (ex: waiting on user confirming their password)
      if (Identify.isBooleanTrue(action.original.wait)) {
        log.grey(
          `Popup action for popUpView "${popUpView}" is ` +
            `waiting on a response. Aborting now...`,
          action,
        )
        await ref?.abort?.()
      }
    } else {
      let msg = `Tried to ${action.actionType === 'popUp' ? 'show' : 'hide'}`
      log.func(action.actionType)
      log.red(
        `${msg} a ${action.actionType} element but the element ` +
          `was null or undefined`,
        { action, popUpView },
      )
    }
  }

  const popUpDismiss: Store.ActionObject['fn'] = async function onPopUpDismiss(
    action,
    options,
  ) {
    log.func('popUpDismiss')
    log.grey('', action)
    await Promise.all(
      app.ndom.actions?.popUp?.map((obj: Store.ActionObject) =>
        obj?.fn?.(action, options),
      ),
    )
  }

  const refresh: Store.ActionObject['fn'] = async function onRefresh(
    action,
    options,
  ) {
    log.func('refresh')
    log.grey('', action)
    window.location.reload()
  }

  const saveObject: Store.ActionObject['fn'] = async function onSaveObject(
    action,
    options,
  ) {
    log.func('saveObject')
    log.grey('', action)

    const { getRoot, ref } = options
    const { object } = action.original || {}
    const pageName = app.mainPage?.page || ''

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
                    page: pageName,
                    root: getRoot(),
                  })
                } else {
                  nameField =
                    get(app.noodl?.root, nameFieldPath, null) ||
                    get(app.noodl?.root?.[pageName], nameFieldPath, {})
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
          action,
        )
      }
    } catch (error) {
      console.error(error)
      toast(error.message, { type: 'error' })
      ref?.abort?.()
    }
  }

  const toastAction: Store.ActionObject['fn'] = async function onToast(
    action,
    options,
  ) {
    try {
      log.func('toast')
      log.gold('', action)
      toast(action.original?.message || '')
    } catch (error) {
      toast(error.message, { type: 'error' })
    }
  }

  const updateObject: Store.ActionObject['fn'] = async function onUpdateObject(
    action,
    { component, ref },
  ) {
    log.func('updateObject')
    log.grey('', action)

    let file: File | undefined

    try {
      if (action.original?.dataObject === 'BLOB') {
        const { files, status } = await onSelectFile()
        if (status === 'selected' && files?.[0]) {
          log.grey(`File selected`, files[0])
          file = files[0]
          // @ts-expect-error
        } else if (status === 'canceled') {
          log.red('File was not selected and the operation was aborted')
          await ref?.abort?.('File input window was closed')
        }
      }

      let object: any

      // This is the more older version of the updateObject action object where it used
      // the "object" property
      if (u.isObj(action.original) && 'object' in action.original) {
        object = action.original.object
      }
      // This is the more newer version that is more descriptive, utilizing the data key
      // action = { actionType: 'updateObject', dataKey, dataObject }
      else if (action.original?.dataKey || action.original?.dataObject) {
        object = omit(action.original, 'actionType')
      }

      if (u.isFnc(object)) {
        const result = await object()
        log.grey(`Invoked "object" that was a function`, { object, result })
      } else if (u.isStr(object)) {
        log.red(
          `A string was received as the "object" property. Possible parsing error?`,
          action,
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
          log.grey(`Calling updateObject with:`, params)
          const result = await app.noodl.updateObject(params)
          log.grey(`Called updateObject and received: `, result)
        } else {
          log.red(`Invalid/empty dataObject`, { action, dataObject })
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
    pageJump,
    popUp,
    popUpDismiss,
    refresh,
    saveObject,
    toast: toastAction,
    updateObject,
  }
}

export default createActions
