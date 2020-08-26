import _ from 'lodash'
import {
  ActionChainActionCallback,
  ActionChainActionCallbackOptions,
  getDataValues,
  NOODLChainActionBuiltInObject,
} from 'noodl-ui'
import { Account } from '@aitmed/cadl'
import { cadl } from 'app/client'
import app from 'App'
import validate, { getFormErrors } from 'utils/validate'
import { formatPhoneNumber } from 'utils/phone'
import VerificationCode from 'components/VerificationCode'
import {
  setAuthStatus,
  setIsCreatingAccount,
  setVerificationCodePending,
} from 'features/auth'

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
builtInActions.checkUsernamePassword = async (
  action,
  { dataValues = {} },
): Promise<'abort'> => {
  // dispatchRedux(mergeCacheAuthValues(dataValues))
  const { password, confirmPassword } = dataValues
  if (password !== confirmPassword) {
    window.alert('Your passwords do not match')
    return 'abort'
  }
  // await signup?.onSubmitCreateAccount(dataValues)
  return 'abort'
}

// Called when user enters their verification code in the popup and clicks submit
builtInActions.enterVerificationCode = async (action, options) => {
  const logMsg = `%centerVerificationCode`
  const logStyle = `color:#ec0000;font-weight:bold;`
  console.log(logMsg, logStyle, { action, options })
  // if (/SignUp/.test(location.pathname)) await signup?.onSubmit()
  // else await signin?.onSubmit()
}

builtInActions.goBack = async () => {
  app.page.goBack()
}

builtInActions.goto = async () => {
  console.log(' builtIn goto invoked')
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
  const store = app.getStore()
  const state = store.getState()

  const logMsg = `%cSIGNIN BUILTIN ARGS`
  const logStyle = `color:#ec0000;font-weight:bold;`
  console.log(logMsg, logStyle, {
    action,
    ...options,
    dataValues: getDataValues(),
  })
  try {
    switch (state.auth.status) {
      case 'logged.in': {
        cadl?.root?.actions?.['SignIn']?.update()
        await app.page.navigate(app.page.getDashboardPath())
        return
      }
      case 'logged.out': {
        let formValues = { ...getDataValues(), countryCode: 'US' } as any
        const password = formValues?.password || ''
        const errMsg = validate.password(password)
        const logMsg = `%c[builtIn.ts][signIn][logged.out] Form values`
        const logStyle = `color:#00b406;font-weight:bold;`
        console.log(logMsg, logStyle, formValues)
        if (errMsg) return window.alert(errMsg)
        await cadl?.root?.builtIn?.loginByPassword?.(password)
        await app.page.navigate(app.page.getDashboardPath())
        return
      }
      case 'new.device': {
        const formValues: any = { ...getDataValues() }
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
            return 'abort'
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
          app.dispatch(setVerificationCodePending(params))
          const verificationElem = new VerificationCode({
            onUnload: () => {
              app.dispatch(setVerificationCodePending(false))
              if (state.auth.isCreating) {
                app.dispatch(setIsCreatingAccount(false))
              }
            },
          })
          verificationElem.render()

          // app.dispatch(
          //   toggleModal({
          //     context: getModalContext('verificationCode'),
          //     data: formValues,
          //     options: {
          //       initialTimer: cadl?.verificationRequest?.timer,
          //     },
          //   }),
          // )
          return 'abort'
        }
        /*
          * Step 1 - user entered verification code and is submitting it
              This logic is abstracted into its own func because it has special catch conditions
          */
        if (state.auth.verification.pending && modal.opened) {
          /*
          * Step 2 - user entered verification code and is submitting it
              false  --> state.account.auth.verification.pending
              false --> state.app.modal.opened
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
            app.dispatch(toggleModal(false))
            app.dispatch(setIsCreatingAccount(true))
            app.dispatch(setAuthStatus('temporary'))
            await app.page.goToPage('CreateNewAccount')
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
            app.dispatch(setAuthStatus('logged.in'))
          } else if (newStatus.code === 1) {
            app.dispatch(setAuthStatus('logged.out'))
          } else if (newStatus.code === 2) {
            app.dispatch('new.device')
          }
          // Prepare UI states
          app.dispatch(toggleModal(false))
          // Call the callback which will take care of the steps ahead
          const dashboardPg = app.page.getPagePath(
            app.page.getDashboardPath(cadl.cadlBaseUrl) || '',
          )
          await app.page.goToPage(dashboardPg)
        }
        return
      }
      // Temp account -- An existing user that is registered invited this new user
      // using the app
      case 3: {
        return
      }
      default:
        return
    }
  } catch (error) {
    if (/(CANNOT_FIND_UID)/i.test(error.name)) {
      // We are purposely not setting pending.verification to false because we're going to delegate
      //    the control to the signup hook which will handle that instead
      app.dispatch(setIsCreatingAccount(true))
      // If it reached this line then the user is coming from VerificationCode
      //    The values here are guaranteed since its passed from the arguments
      console.error(error)
      // await signup.onSubmit({ skipToCreate: true, formValues })
    } else {
      console.error(error)
      window.alert(error.message)
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

/* -------------------------------------------------------
  ---- Built in funcs below are for the SDK
-------------------------------------------------------- */

// This goes on the SDK
export async function videoChat(
  action: NOODLChainActionBuiltInObject & {
    roomId: string
    accessToken: string
  },
) {
  let builtInRunning = false

  if (!builtInRunning) {
    builtInRunning = true

    const logMsg = `%c[ACTION][onVideoChat] builtIn`
    const logStyle = `color:#3498db;font-weight:bold;`
    console.log(logMsg, logStyle)

    console.log(
      `%c[PageContext.tsx][onPageChange][ACTION] builtIn`,
      `color:#3498db;font-weight:bold;`,
      action,
    )
    // Disconnect from the room if for some reason we
    // are still connected to one
    // if (room.state === 'connected' || room.state === 'reconnecting') {
    //   room?.disconnect?.()
    //   if (connecting) setConnecting(false)
    // }
    // const newRoom = await connect(action.accessToken)
    // if (newRoom) {
    //   const msg = `Connected to room: ${newRoom.name}`
    //   toast.success(msg, { toastId: msg })
    // }
  } else {
    console.log(
      `%c[ACTION][onVideoChat] builtIn: A duplicate call to this action was detected. This call was aborted to prevent the duplicate call`,
      `color:#3498db;font-weight:bold;`,
    )
  }
  builtInRunning = false
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

export default builtInActions
