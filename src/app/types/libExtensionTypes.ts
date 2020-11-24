import { BuiltInObject } from 'noodl-ui'

export interface NOODLBuiltInCheckFieldObject extends BuiltInObject {
  funcName: 'checkField'
  contentType: 'messageHidden' | 'passwordHidden'
}
