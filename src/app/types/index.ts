import { ActionChainActionCallback, BuiltInObject } from 'noodl-ui'

export * from './commonTypes'
export * from './domExtendedTypes'
export * from './libExtensionTypes'
export * from './meetingTypes'
export * from './pageTypes'

export type BuiltInFuncName =
  | 'checkField'
  | 'checkUsernamePassword'
  | 'cleanLocalStorage'
  | 'goBack'
  | 'goto'
  | 'lockApplication'
  | 'logOutOfApplication'
  | 'logout'
  | 'redraw'
  | 'toggleCameraOnOff'
  | 'toggleFlag'
  | 'toggleMicrophoneOnOff'

export type BuiltInActions<Obj extends BuiltInObject = BuiltInObject> = Partial<
  Record<BuiltInFuncName, ActionChainActionCallback<Obj>>
>
