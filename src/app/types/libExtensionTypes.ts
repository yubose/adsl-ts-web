import { NOODLBuiltInObject } from 'noodl-ui'

export interface NOODLBuiltInCheckFieldObject extends NOODLBuiltInObject {
  funcName: 'checkField'
  contentType: 'messageHidden' | 'passwordHidden'
}
