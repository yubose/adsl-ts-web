import _ from 'lodash'
import {
  ActionChainActionCallback,
  isReference,
  NOODLActionChainActionType,
  EvalObjectAction,
  Goto as GotoAction,
  PageJumpAction,
  PopUpAction,
  PopUpDismissAction,
  RefreshAction,
  UpdateObjectAction,
  getByDataUX,
  SaveObjectAction,
} from 'noodl-ui'
import { cadl } from 'app/client'
import { AppStore } from 'app/types/storeTypes'
import Page from 'Page'
import { setPage } from 'features/page'

const makeActions = function ({
  store,
  page,
}: {
  store: AppStore
  page: Page
}) {
  // @ts-expect-error
  const _actions: Record<
    NOODLActionChainActionType,
    ActionChainActionCallback<any>
  > = {}

  _actions.evalObject = async (action: EvalObjectAction, options) => {
    if (_.isFunction(action?.object)) {
      await action.object()
    } else {
      const logMsg =
        `%c[actions.ts][evalObject] ` +
        `Expected to receive the "object" as a function but it was "${typeof action.object}" instead`
      console.log(logMsg, `color:#3498db;font-weight:bold;`, {
        action,
        ...options,
      })
    }
  }

  _actions.goto = async (action: GotoAction, options) => {
    // URL
    if (_.isString(action)) {
      if (action.startsWith('http')) {
        await page.navigate(action)
      } else {
        store.dispatch(setPage(action))
      }
    } else if (_.isPlainObject(action)) {
      // Currently don't know of any known properties the goto syntax has.
      // We will support a "destination" key since it exists on goto which will
      // soon be deprecated by this goto action
      if (action.destination) {
        if (action.destination.startsWith('http')) {
          await page.navigate(action.destination)
        } else {
          store.dispatch(setPage(action.destination))
        }
      } else {
        const logMsg =
          '[ACTION][goto] ' +
          'Tried to go to a page but could not find information on the whereabouts'
        console.log(logMsg, `color:#ec0000;font-weight:bold;`, {
          action,
          ...options,
        })
      }
    }
  }

  _actions.pageJump = async (action: PageJumpAction, options) => {
    const logMsg = `%c[actions.ts][pageJump]`
    console.log(logMsg, `color:#3498db;font-weight:bold;`, {
      action,
      ...options,
    })
    store.dispatch(setPage(action.destination))
  }

  _actions.popUp = (action: PopUpAction, options) => {
    const elem = getByDataUX(action.popUpView) as HTMLElement
    if (elem) {
      if (action.actionType === 'popUp') {
        elem.style.visibility = 'visible'
      } else if (action.actionType === 'popUpDismiss') {
        elem.style.visibility = 'hidden'
      }
    } else {
      const logMsg =
        `%c[action.ts][popUp]` +
        `Tried to make a "${action.actionType}" element visible but the element node was null or undefined`
      console.log(logMsg, `color:#ec0000;font-weight:bold;`, {
        action,
        ...options,
      })
    }
  }

  _actions.popUpDismiss = async (action: PopUpDismissAction, options) => {
    return _actions.popUp(action, options)
  }

  _actions.refresh = (action: RefreshAction, options) => {
    const logMsg = `%c[action.ts][refresh] ${action.actionType}`
    console.log(logMsg, `color:#3498db;font-weight:bold;`, {
      action,
      ...options,
    })
    window.location.reload()
  }

  _actions.saveObject = async (action: SaveObjectAction, options) => {
    const { context, dataValues, parser } = options

    try {
      const { object } = action

      const logMsg = `%c[action.ts][saveObject]`
      console.log(logMsg, `color:#3498db;font-weight:bold;`, {
        action,
        ...options,
      })

      if (_.isFunction(object)) {
        const logMsg =
          `%c[action.ts][saveObject] ` +
          `Directly invoking the object function with no parameters`
        console.log(logMsg, `color:#3498db;font-weight:bold;`, {
          action,
          options,
        })
        await object()
      } else if (_.isArray(object)) {
        for (let index = 0; index < object.length; index++) {
          const obj = object[index]

          if (_.isArray(obj)) {
            // Assuming this a tuple where the first item is the path to the "name" field
            // and the second item is the actual function that takes in values from using
            // the name field to retrieve values
            if (obj.length === 2) {
              const [nameFieldPath, save] = obj

              if (_.isString(nameFieldPath)) {
                if (_.isFunction(save)) {
                  parser.setLocalKey(context?.page?.name)

                  let nameField

                  if (isReference(nameFieldPath)) {
                    nameField = parser.get(nameFieldPath)
                  } else {
                    nameField =
                      _.get(cadl?.root, nameFieldPath, null) ||
                      _.get(
                        cadl?.root?.[context?.page?.name],
                        nameFieldPath,
                        {},
                      )
                  }

                  const params = { ...nameField }

                  if ('verificationCode' in params) {
                    delete params.verificationCode
                  }

                  const logMsg = `%c[action.ts][saveObject]`
                  console.log(logMsg, `color:#3498db;font-weight:bold;`, {
                    action,
                    dataValues,
                    params,
                    nameFieldPath,
                    ...options,
                  })

                  await save(params)
                }
              }
            } else {
              const logMsg =
                `%c[action.ts][saveObject] ` +
                `Received an array inside a "saveObject" action as an item of an ` +
                `"object" array. Currently we are using tuples of length 2`
              console.log(logMsg, `color:#ec0000;font-weight:bold;`, {
                action,
                ...options,
              })
            }
          }
        }
      } else if (_.isPlainObject(object)) {
        //
      } else {
        const logMsg =
          `%c[action.ts][saveObject] ` +
          `saveObject with property "object" was not received as a function, ` +
          `object or  Possibly a parsing error`
        console.log(logMsg, `color:#ec0000;font-weight:bold;`, {
          action,
          ...options,
        })
      }
    } catch (error) {
      console.error(error)
      window.alert(error.message)
      return 'abort'
    }
  }

  _actions.updateObject = (action: UpdateObjectAction, options) => {
    //
  }

  return _actions
}

export default makeActions
