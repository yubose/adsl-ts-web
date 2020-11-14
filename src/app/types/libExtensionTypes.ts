import { BuiltInActionObject } from 'noodl-ui'

export interface NOODLBuiltInCheckFieldObject extends BuiltInActionObject {
  funcName: 'checkField'
  contentType: 'messageHidden' | 'passwordHidden'
}
