import { ActionChainActionCallback, NOODLBuiltInObject } from 'noodl-ui'

export * from './commonTypes'
export * from './domExtendedTypes'
export * from './libExtensionTypes'
export * from './meetingTypes'
export * from './pageTypes'

export type BuiltInFuncName =
  | 'checkField'
  | 'checkUsernamePassword'
  | 'checkVerificationCode'
  | 'cleanLocalStorage'
  | 'enterVerificationCode'
  | 'goBack'
  | 'goto'
  | 'lockApplication'
  | 'logOutOfApplication'
  | 'logout'
  | 'redraw'
  | 'signIn'
  | 'signUp'
  | 'signout'
  | 'toggleCameraOnOff'
  | 'toggleFlag'
  | 'toggleMicrophoneOnOff'
  | 'UploadDocuments'
  | 'UploadFile'
  | 'UploadPhoto'

export type BuiltInActions<
  Obj extends NOODLBuiltInObject = NOODLBuiltInObject
> = Partial<Record<BuiltInFuncName, ActionChainActionCallback<Obj>>>
