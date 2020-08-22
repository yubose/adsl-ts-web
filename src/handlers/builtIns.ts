import _ from 'lodash'
import {
  ActionChainActionCallback,
  ActionChainActionCallbackOptions,
  NOODLChainActionBuiltInObject,
} from 'noodl-ui'

// ALL BUILT IN FUNCS WERE ATTEMPTED TO BE ARRANGED IN ORDER OF INVOCATION THROUGHOUT THE APP
const builtInActions: Record<
  string,
  ActionChainActionCallback<NOODLChainActionBuiltInObject>
> = {}

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
builtInActions.enterVerificationCode = async () => {
  // if (/SignUp/.test(location.pathname)) await signup?.onSubmit()
  // else await signin?.onSubmit()
}

builtInActions.goBack = () => {
  window.history.back()
}

builtInActions.lockApplication = () => {
  //
}

builtInActions.logOutOfApplication = () => {
  //
}

builtInActions.logout = () => {
  //
}

builtInActions.signIn = () => {
  //
}

builtInActions.signUp = () => {
  //
}

builtInActions.signout = () => {
  //
}

builtInActions.toggleCameraOnOff = () => {
  //
}

builtInActions.toggleMicrophoneOnOff = () => {
  //
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
