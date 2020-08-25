import _ from 'lodash'
import {
  ActionChainActionCallback,
  ActionChainActionCallbackOptions,
  getDataValues,
  NOODLChainActionBuiltInObject,
} from 'noodl-ui'

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
  window.history.back()
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
  const logMsg = `%cSIGNIN BUILTIN ARGS`
  const logStyle = `color:#ec0000;font-weight:bold;`
  console.log(logMsg, logStyle, {
    action,
    ...options,
    dataValues: getDataValues(),
  })
  //
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
