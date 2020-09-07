import _ from 'lodash'
import {
  ActionChainActionCallback,
  ActionChainActionCallbackOptions,
  getDataValues,
  NOODLChainActionBuiltInObject,
  NOODLGotoAction,
} from 'noodl-ui'
import { Account } from '@aitmed/cadl'
import { cadl } from 'app/client'
import Page from 'Page'
import validate, { getFormErrors } from 'utils/validate'
import { formatPhoneNumber } from 'utils/phone'
import VerificationCode from 'components/modalComponents/VerificationCode'
import { openOutboundURL } from 'utils/common'
import { openModal, closeModal, setPage } from 'features/page'
import {
  setAuthStatus,
  setIsCreatingAccount,
  setVerificationCodePending,
} from 'features/auth'
import { modalIds } from '../constants'
import { AppStore } from 'app/types'

export type BuiltInFuncName =
  | 'checkUsernamePassword'
  | 'checkVerificationCode'
  | 'enterVerificationCode'
  | 'goBack'
  | 'goto'
  | 'lockApplication'
  | 'logOutOfApplication'
  | 'logout'
  | 'signIn'
  | 'signUp'
  | 'signout'
  | 'toggleCameraOnOff'
  | 'toggleMicrophoneOnOff'
  | 'UploadPhoto'

const makeBuiltInActions = function ({
  store,
  page,
}: {
  store: AppStore
  page: Page
}) {
  // @ts-expect-error
  const builtInActions: Record<
    BuiltInFuncName,
    ActionChainActionCallback<NOODLChainActionBuiltInObject>
  > = {}

  // Called on signin + signup
  builtInActions.checkVerificationCode = async (action) => {
    //
  }

  // Called after uaser fills out the form in CreateNewAccount and presses Submit
  builtInActions.checkUsernamePassword = (
    action,
    { abort },
  ): Promise<'abort'> => {
    // dispatchRedux(mergeCacheAuthValues(dataValues))
    const { password, confirmPassword } = getDataValues()
    if (password !== confirmPassword) {
      window.alert('Your passwords do not match')
      abort('Passwords do not match')
    }
    // await signup?.onSubmitCreateAccount(dataValues)
    abort('Creating account')
  }

  // Called when user enters their verification code in the popup and clicks submit
  builtInActions.enterVerificationCode = async (action, options) => {
    const logMsg = `%c[builtIns.ts][builtIn -- enterVerificationCode]`
    console.log(logMsg, `color:#ec0000;font-weight:bold;`, {
      action,
      ...options,
    })
    // if (/SignUp/.test(location.pathname)) await signup?.onSubmit()
    // else await signin?.onSubmit()
  }

  builtInActions.goBack = () => {
    const { page } = store.getState()
    const { previousPage } = page
    if (previousPage) {
      store.dispatch(setPage(previousPage))
    } else {
      const logMsg =
        '%c[builtIns.ts][builtIn -- goBack] ' +
        'Tried to navigate to a previous page but a previous page could not ' +
        'be found'
      console.log(logMsg, `color:#ec0000;font-weight:bold;`, page)
    }
  }

  builtInActions.goto = async (action: NOODLGotoAction, options) => {
    const logMsg = `%c[builtIns.ts][goto]`
    console.log(logMsg, `color:#3498db;font-weight:bold;`, {
      action,
      ...options,
    })
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
        if (action.startsWith('http')) {
          await page.navigate(action.destination)
        } else {
          store.dispatch(setPage(action.destination))
        }
      } else {
        const logMsg =
          '[ACTION][builtIn -- goto] ' +
          'Tried to go to a page but could not find information on the whereabouts'
        console.log(logMsg, `color:#ec0000;font-weight:bold;`, {
          action,
          ...options,
        })
      }
    }
  }

  builtInActions.lockApplication = async () => {
    //
  }

  builtInActions.logOutOfApplication = async () => {
    //
  }

  builtInActions.logout = async () => {
    //
  }

  builtInActions.signIn = async (action, options) => {
    const state = store.getState()
    const logMsg = `%cSIGNIN BUILTIN ARGS`

    console.log(logMsg, `color:#ec0000;font-weight:bold;`, {
      action,
      ...options,
      dataValues: getDataValues(),
    })

    try {
      switch (state.auth.status) {
        case 'logged.in': {
          cadl?.root?.actions?.['SignIn']?.update()
          store.dispatch(setPage(page.getDashboardPath()))
          return
        }
        case 'logged.out': {
          let formValues = { ...getDataValues(), countryCode: 'US' } as any
          const password = formValues?.password || ''
          const errMsg = validate.password(password)
          const logMsg = `%c[builtIn.ts][signIn][logged.out] Form values`
          console.log(logMsg, `color:#00b406;font-weight:bold;`, formValues)
          if (errMsg) return window.alert(errMsg)
          await cadl?.root?.builtIn?.loginByPassword?.(password)
          store.dispatch(page.getDashboardPath())
          return
        }
        case 'new.device': {
          const formValues: any = { ...getDataValues(), countryCode: 'US' }
          /*
           * Step 1 - user didn't enter their verification code yet
           */
          if (!state.auth.verification.pending) {
            console.log(
              `%cformValues`,
              'color:#20B2AA;font-weight:bold;',
              formValues,
            )
            // Validate the form
            const errors = await getFormErrors(formValues)
            if (errors.length) {
              window.alert(errors[0])
              return {
                abort: errors,
              }
            }
            // The phone number needs to be formatted with country code
            const formattedPhoneNum = await formatPhoneNumber({
              phoneNumber: formValues.phoneNumber,
              countryCode: formValues.countryCode,
            })
            const verificationCodeTimer = cadl?.verificationRequest?.timer
            let params: any
            // Users need to wait 60 sec before they request a new one. If the timer
            // is still running, avoid the request and continue waiting for that verification code
            // Otherwise run this block and send a new request
            if (!verificationCodeTimer) {
              // Starts the login flow by asking for the verification code before proceeding
              const code = await Account.requestVerificationCode(
                formattedPhoneNum,
              )
              console.log(`%c${code}`, 'color:#8e44ad;font-weight:bold;')
              if (_.isString(formValues.phoneNumber)) {
                if (formValues.phoneNumber.startsWith('888')) {
                  params = { pending: true, code }
                } else {
                  params = true
                }
              }
            } else {
              params = { pending: true }
              if (state.auth.verification.code) {
                params['code'] = state.auth.verification.code
              }
            }
            store.dispatch(setVerificationCodePending(params))
            const verificationElem = new VerificationCode({
              onUnload: () => {
                store.dispatch(setVerificationCodePending(false))
                if (state.auth.isCreating) {
                  store.dispatch(setIsCreatingAccount(false))
                }
              },
            })

            verificationElem.render()

            store.dispatch(
              openModal({
                id: modalIds.VERIFICATON_CODE,
                props: {
                  formValues,
                  initialTimer: cadl?.verificationRequest?.timer,
                },
              }),
            )

            abort('User is entering verification code')
          }
          /*
          * Step 1 - user entered verification code and is submitting it
              This logic is abstracted into its own func because it has special catch conditions
          */
          const modal = store.getState().page.modal

          if (state.auth.verification.pending && modal.opened) {
            /*
          * Step 2 - user entered verification code and is submitting it
              false  --> state.account.auth.verification.pending
              false --> state.store.modal.opened
          */
            // formValues is coming from VerificationCode at this point
            const { countryCode, phoneNumber = '' } = formValues
            // We don't need to validate the fields at this point since we already did
            //    when they came here
            const params = {
              phoneNumber: await formatPhoneNumber({
                phoneNumber,
                countryCode,
              }),
              password: formValues.password,
              verificationCode: formValues.verificationCode,
            }

            console.log(
              `%c[useSignin.tsx][onSubmitLogin] Sign in params`,
              `color:#00b406;font-weight:bold;`,
              params,
            )

            const newStatus = await cadl?.root?.builtIn?.signIn?.(params)

            // User was invited by an existing member. This account is marked as temporary
            if (newStatus?.code === 3) {
              console.log(
                `%c[builtIn.ts] This account is marked temporary because an existing user sent an invite to it. Redirecting to the create account page...`,
                `color:#3498db;font-weight:bold;`,
                { formValues, status: newStatus },
              )
              store.dispatch(closeModal())
              store.dispatch(setIsCreatingAccount(true))
              store.dispatch(setAuthStatus('temporary'))
              await page.goToPage('CreateNewAccount')
              return
            }

            // noodl?.root?.SignIn?.update()
            cadl?.root?.actions?.['SignIn']?.update()
            console.log(
              `%cLogin profile/UserVertex`,
              'color:#2ecc3b;font-weight:bold;',
              cadl?.root?.Global?.currentUser?.vertex,
            )

            if (newStatus.code === 0) {
              store.dispatch(setAuthStatus('logged.in'))
            } else if (newStatus.code === 1) {
              store.dispatch(setAuthStatus('logged.out'))
            } else if (newStatus.code === 2) {
              store.dispatch(setAuthStatus('new.device'))
            }
            // Prepare UI states
            store.dispatch(closeModal())
            // Call the callback which will take care of the steps ahead
            const dashboardPg = page.getPagePath(
              page.getDashboardPath(cadl.cadlBaseUrl) || '',
            )
            await page.goToPage(dashboardPg)
          }
          return
        }
        // Temp account -- An existing user that is registered invited this new user
        // using the app
        default:
          return
      }
    } catch (error) {
      if (/(CANNOT_FIND_UID)/i.test(error.name)) {
        // We are purposely not setting pending.verification to false because we're going to delegate
        //    the control to the signup hook which will handle that instead
        store.dispatch(setIsCreatingAccount(true))
        // If it reached this line then the user is coming from VerificationCode
        //    The values here are guaranteed since its passed from the arguments
        console.error(error)
        // await signup.onSubmit({ skipToCreate: true, formValues })
      } else {
        // console.error(error)
        // window.alert(error.message)
        console.error(error.stack)
        console.error(error.stack)
        console.error(error.stack)
        console.error(error.stack)
        throw error
      }
    }
  }

  builtInActions.signUp = async () => {
    //
  }

  builtInActions.signout = async () => {
    //
  }

  builtInActions.toggleCameraOnOff = async () => {
    //
  }

  builtInActions.toggleMicrophoneOnOff = async () => {
    //
  }

  builtInActions.UploadPhoto = async function (
    action: NOODLChainActionBuiltInObject,
    { event },
  ) {
    console.log(
      `%c[useBuiltInActions.tsx][builtIn -- UploadPhoto]`,
      `color:#95a5a6;font-weight:bold;`,
      { action, event },
    )
    const input = document.createElement('input')
    input.type = 'file'
    // TODO: string files
    // @ts-expect-error
    input.onchange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log(e?.target?.files)
      const file = e.target?.files?.[0]
      if (file) {
        const dataValues = getDataValues()
        const title = dataValues?.title
        const filename = file.name
        const filesize = file.size
        const filetype = file.type

        const params = {
          title: filename,
          content: file,
        }

        const doc = await cadl.root?.builtIn?.uploadDocument(params)
        console.log(
          `%c[builtIns.ts][builtIn -- UploadDocument] ` +
            `Uploaded document named "${filename}" of type "${filetype}"`,
          `color:#00b406;font-weight:bold;`,
          doc,
        )
      }
    }
    input.click()
  }

  async function _goToURI(url: string) {
    if (_.isString(url)) {
      // Outside link
      if (url.startsWith('http')) {
        openOutboundURL(url)
      } else {
        // Default to redirecting to the (assumed) local page path/endpoint
        store.dispatch(setPage(url.replace('/', '')))
      }
    }
  }

  return builtInActions
}

/* -------------------------------------------------------
  ---- Built in funcs below are for the SDK
-------------------------------------------------------- */

// This goes on the SDK
export function onVideoChatBuiltIn(joinRoom: (token: string) => Promise<any>) {
  return async (
    action: NOODLChainActionBuiltInObject & {
      roomId: string
      accessToken: string
    },
  ) => {
    let builtInRunning = false

    if (!builtInRunning) {
      builtInRunning = true

      const logMsg = `%c[ACTION][onVideoChat] builtIn`
      const logStyle = `color:#3498db;font-weight:bold;`
      console.log(logMsg, logStyle)

      console.log(
        `%c[builtIns.ts][onVideoChat] builtIn --> videoChat`,
        `color:#3498db;font-weight:bold;`,
        action,
      )
      // Disconnect from the room if for some reason we
      // are still connected to one
      // if (room.state === 'connected' || room.state === 'reconnecting') {
      //   room?.disconnect?.()
      //   if (connecting) setConnecting(false)
      // }
      const newRoom = await joinRoom(action.accessToken)
      if (newRoom) {
        const msg = `Connected to room: ${newRoom.name}`
        const logMsg = `%c[builtIns.ts][onVideoChatBuiltIn]` + msg
        console.log(logMsg, `color:#00b406;font-weight:bold;`)
      }
    } else {
      console.log(
        `%c[ACTION][onVideoChat] builtIn: A duplicate call to this action was detected. This call was aborted to prevent the duplicate call`,
        `color:#3498db;font-weight:bold;`,
      )
    }
    builtInRunning = false
  }
}

// function useBuiltInActions({}: // signin,
// // signup,
// // lockLogout,
// BuiltInActionsOptions) {
//   const history = useHistory()
//   const location = useLocation()
//   const { toggleCamera } = useMeetingRoomCtx()
//   const { toggleLocalAudio } = useLocalAudioToggle()

//   return {
//     goBack: history.goBack as any,
//     lockApplication: lockLogout?.onSubmit('lock'),
//     logOutOfApplication: lockLogout?.onSubmit('logout'),
//     logout: () => lockLogout?.logout(true),
//     signIn: (
//       action: NOODLChainActionBuiltInObject,
//       { dataValues }: ActionChainActionCallbackOptions,
//     ) => signin?.onSubmit({ formValues: dataValues }),
//     signUp: (
//       action: NOODLChainActionBuiltInObject,
//       { dataValues }: ActionChainActionCallbackOptions,
//     ) => signup?.onSubmit({ formValues: dataValues } as any),
//     signout: () => lockLogout?.logout(true),
//     toggleCameraOnOff: toggleCamera,
//     toggleMicrophoneOnOff: toggleLocalAudio,
//   }
// }

export function onBuiltinMissing(
  action: NOODLChainActionBuiltInObject,
  options: ActionChainActionCallbackOptions,
) {
  window.alert(`The button "${action.funcName}" is not available to use yet`)
}

export default makeBuiltInActions
