import type { LiteralUnion } from 'type-fest'
import type { OrArray } from './_internal/types'
import type { EmitObjectFold, GotoObject, IfObject } from './uncategorizedTypes'
import type { BuiltInEvalObject, DataIn, ReferenceString } from './ecosTypes'

export interface UncommonActionObjectProps {
  actions?: any[]
  contentType?: string // ex: "messageHidden"
  /**
   * @example
   * ```json
   * {
   *   "emit": {
   *     "actions": [
   *       { "=.builtIn.string.equal": {...} }
   *     ],
   *     "dataKey": {
   *       "var1": "itemObject.color"
   *     },
   *   }
   * }
   * ```
   */
  emit?: EmitObjectFold
  dataKey?: any
  dataIn?: any
  dataObject?: any
  destination?: string
  dismissOnTouchOutside?: boolean
  evolve?: boolean
  /**
   * @example
   * ```json
   * {
   *   "actionType": "builtIn",
   *   "funcName": "redraw",
   *   "viewTag": "mainView"
   * }
   * ```
   */
  funcName?: string
  message?: string
  object?: any
  pageReload?: boolean
  popUpView?: string
  reload?: boolean
  timer?: number
  /**
   * @example
   * ```json
   * {
   *   "actionType": "builtIn",
   *   "funcName": "redraw",
   *   "viewTag": "mainView"
   * }
   * ```
   */
  viewTag?: string
  wait?: boolean | number
}

export interface ActionObject<T extends string = string> {
  actionType: T
  [key: string]: any
}

/**
 * @example
 * ```json
 * {
 *   "actionType": "builtIn",
 *   "funcName": "redraw",
 *   "viewTag": "mainView"
 * }
 * ```
 */
export interface BuiltInActionObject
  extends ActionObject,
    Pick<
      UncommonActionObjectProps,
      'contentType' | 'dataKey' | 'evolve' | 'funcName' | 'reload' | 'viewTag'
    > {
  actionType: 'builtIn'
  [key: string]: any
}

/**
 * @example
 * ```json
 * {
 *   "actionType": "evalObject",
 *   "object": [
 *     {
 *       "=.builtIn.object.set": {
 *         "object": "..formData.userProfile",
 *         "key": "username",
 *         "value": ".SignIn.tempUser.username"
 *       }
 *     }
 *   ]
 * }
 * ```
 */
export interface EvalActionObject
  extends ActionObject,
    Pick<UncommonActionObjectProps, 'dataKey' | 'dataObject'> {
  actionType: 'evalObject'
  object?: OrArray<
    | IfObject
    | BuiltInEvalObject
    | BuiltInActionObject
    | GotoObject<string | { dataIn?: DataIn }>
    | ''
    | Record<
        ReferenceString,
        | null
        | boolean
        | BuiltInEvalObject
        | LiteralUnion<ReferenceString, string>
        | number
        | string
        | Record<ReferenceString, ReferenceString>
      >
  >
  [key: string]: any
}

export interface OpenCameraActionObject
  extends ActionObject,
    Pick<UncommonActionObjectProps, 'dataKey' | 'dataObject'> {
  actionType: 'openCamera'
  [key: string]: any
}

export interface OpenPhotoLibraryActionObject
  extends ActionObject,
    Pick<UncommonActionObjectProps, 'dataKey' | 'dataObject'> {
  actionType: 'openPhotoLibrary'
  [key: string]: any
}

export interface OpenDocumentManagerActionObject
  extends ActionObject,
    Pick<UncommonActionObjectProps, 'dataKey' | 'dataObject'> {
  actionType: 'openDocumentManager'
  [key: string]: any
}

/**
 * @example
 * ```json
 * {
 *   "actionType": "pageJump",
 *   "destination": "MeetingRoomInvited"
 * }
 * ```
 */
export interface PageJumpActionObject
  extends ActionObject,
    Pick<UncommonActionObjectProps, 'destination'> {
  actionType: 'pageJump'
  [key: string]: any
}

/**
 * @example
 * ```json
 * {
 *   "actionType": "popUp",
 *   "popUpView": "mainView"
 * }
 * ```
 */
export interface PopupActionObject
  extends ActionObject,
    Pick<
      UncommonActionObjectProps,
      'dismissOnTouchOutside' | 'popUpView' | 'wait'
    > {
  actionType: 'popUp'
  [key: string]: any
}

/**
 * @example
 * ```json
 * {
 *   "actionType": "popUpDismiss",
 *   "popUpView": "mainView"
 * }
 * ```
 */
export interface PopupDismissActionObject
  extends ActionObject,
    Pick<
      UncommonActionObjectProps,
      'dismissOnTouchOutside' | 'popUpView' | 'wait'
    > {
  actionType: 'popUpDismiss'
  [key: string]: any
}

/**
 * @example
 * ```json
 * {
 *   "actionType": "refresh"
 * }
 * ```
 */
export interface RefreshActionObject extends ActionObject {
  actionType: 'refresh'
  [key: string]: any
}

/**
 * @example
 * ```json
 * {
 *   "actionType": "removeSignature",
 *   "dataObject": "BLOB",
 *   "dataKey": "SignIn.tempUser.signature"
 * }
 * ```
 */
export interface RemoveSignatureActionObject
  extends ActionObject,
    Pick<UncommonActionObjectProps, 'dataObject' | 'dataKey'> {
  actionType: 'removeSignature'
  [key: string]: any
}

/**
 * @example
 * ```json
 * {
 *   "actionType": "saveAction",
 *   "object": "..abc.profile"
 * }
 * ```
 */
export interface SaveActionObject
  extends ActionObject,
    Pick<UncommonActionObjectProps, 'object'> {
  actionType: 'saveObject'
  [key: string]: any
}

/**
 * @example
 * ```json
 * {
 *   "actionType": "saveSignature",
 *   "dataObject": "BLOB",
 *   "dataKey": "SignIn.tempUser.signature"
 * }
 * ```
 */
export interface SaveSignatureActionObject
  extends ActionObject,
    Pick<UncommonActionObjectProps, 'dataObject' | 'dataKey'> {
  actionType: 'saveSignature'
  [key: string]: any
}

export interface GetLocationAddressActionObject
  extends ActionObject,
    Pick<UncommonActionObjectProps, 'dataKey'> {
  actionType: 'getLocationAddress'
  [key: string]: any
}

/**
 * @example
 * ```json
 * {
 *   "actionType": "updateObject",
 *   "dataObject": "BLOB",
 *   "dataKey": "SignIn.tempUser.profile"
 * }
 * ```
 */
export interface UpdateActionObject
  extends ActionObject,
    Pick<UncommonActionObjectProps, 'dataObject' | 'dataKey'> {}

