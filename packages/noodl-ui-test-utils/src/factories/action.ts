import * as u from '@jsmanifest/utils'
import type { NoodlObject } from 'noodl-builder'
import { PartialDeep } from 'type-fest'
import {
  BuiltInActionObject,
  EcosDocument,
  EmitObject,
  EmitObjectFold,
  EvalActionObject,
  GotoObject,
  IfObject,
  NameField,
  PageJumpActionObject,
  PopupActionObject,
  PopupDismissActionObject,
  RefreshActionObject,
  RemoveSignatureActionObject,
  SaveActionObject,
  SaveSignatureActionObject,
  ToastObject,
  UpdateActionObject,
} from 'noodl-types'
import { createActionObject_next } from '../utils'
import builder from '../builder'
import ecosJpgDoc from '../fixtures/jpg.json'
import ecosNoteDoc from '../fixtures/note.json'
import ecosPdfDoc from '../fixtures/pdf.json'
import ecosPngDoc from '../fixtures/png.json'
import ecosTextDoc from '../fixtures/text.json'
import * as t from '../types'

const mergeToObjectNode = (node: NoodlObject, obj: Record<string, any>) => {
  u.entries(obj).forEach(([k, v]) => node.createProperty(k, v))
  return node
}

const actionFactory = (function () {
  function builtIn(obj?: string | Partial<BuiltInActionObject>) {
    const action = builder.action('builtIn')
    const funcName = action.createProperty('funcName')
    if (u.isStr(obj)) {
      funcName.setValue(obj)
    } else if (obj) mergeToObjectNode(action, obj)
    return action.build()
  }

  function evalObject(
    obj?: EvalActionObject['object'] | Partial<EvalActionObject>,
  ): EvalActionObject {
    const node = builder.action('evalObject')
    if (!obj) {
      node.createProperty('object', undefined)
    } else {
      if (!('actionType' in obj)) node.createProperty(obj['object'])
    }
    return node.build() as EvalActionObject
  }

  function pageJump(
    props?: Partial<PageJumpActionObject>,
  ): PageJumpActionObject {
    return { actionType: 'pageJump', destination: 'SignIn', ...props }
  }

  function popUp(
    props?: string | Partial<PopupActionObject>,
  ): PopupActionObject {
    const obj = {
      actionType: 'popUp',
      popUpView: 'genderView',
    } as PopupActionObject
    if (typeof props === 'string') obj.popUpView = props
    else if (props) u.assign(obj, props)
    return obj
  }

  function popUpDismiss(
    props?: string | Partial<PopupDismissActionObject>,
  ): PopupDismissActionObject {
    const obj = {
      actionType: 'popUpDismiss',
      popUpView: 'helloView',
    } as PopupDismissActionObject
    if (typeof props === 'string') obj.popUpView = props
    else u.assign(obj, props)
    return obj
  }

  function refresh<A extends RefreshActionObject>(props?: Partial<A>) {
    return { actionType: 'refresh', ...props } as A
  }

  function removeSignature<A extends Partial<RemoveSignatureActionObject>>(
    props?: A,
  ) {
    return {
      actionType: 'removeSignature',
      dataKey: 'SignIn.signature',
      dataObject: 'BLOB',
      ...props,
    } as RemoveSignatureActionObject & A
  }

  function saveSignature<A extends Partial<SaveSignatureActionObject>>(
    props?: A,
  ) {
    return {
      actionType: 'saveSignature',
      dataKey: 'SignIn.signature',
      dataObject: 'BLOB',
      ...props,
    } as SaveSignatureActionObject & A
  }

  function saveObject<A extends SaveActionObject>(props?: Partial<A>) {
    return { actionType: 'saveObject', object: {}, ...props } as A
  }

  function toastObject<A extends ToastObject>(props?: Partial<A>) {
    return { toast: { message: 'hello!', style: {}, ...props } }
  }

  function updateObject<A extends UpdateActionObject>(props?: A) {
    return {
      actionType: 'updateObject',
      object: { '.Global.refid@': '___.itemObject.id' },
      ...props,
    }
  }

  /**
   * Generate an eCOS document object by component props
   */
  function ecosDoc<N extends NameField>(
    propsProp?: PartialDeep<EcosDocument<N>>,
  ): EcosDocument<N>
  /**
   * Generate an eCOS document object by preset
   */
  function ecosDoc<N extends NameField>(
    preset?: t.GetEcosDocObjectPreset,
  ): EcosDocument<N>
  /**
   * Generate an eCOS document object
   * @param propsProp - eCOS document preset or component props
   * @returns { EcosDocument }
   */
  function ecosDoc<N extends NameField>(
    propsProp?: t.GetEcosDocObjectPreset | PartialDeep<EcosDocument<N>>,
  ): EcosDocument<N> {
    let ecosObj = {
      name: { data: `blob:http://a0242fasa141inmfakmf24242`, type: '' as any },
    } as Partial<EcosDocument<NameField>>

    if (u.isStr(propsProp)) {
      if (propsProp === 'audio') {
        ecosObj.name = { ...ecosObj.name, type: 'audio/wav' }
        ecosObj.subtype = { ...ecosObj.subtype, mediaType: 2 }
      } else if (propsProp === 'docx') {
        ecosObj.name = { ...ecosObj.name, type: 'application/vnl.' as any }
        ecosObj.subtype = { ...ecosObj.subtype, mediaType: 1 }
      } else if (propsProp === 'image') {
        ecosObj = (ecosPngDoc || ecosJpgDoc) as EcosDocument
      } else if (propsProp === 'message') {
        ecosObj.subtype = { ...ecosObj.subtype, mediaType: 5 }
      } else if (propsProp === 'note') {
        ecosObj = ecosNoteDoc as EcosDocument
      } else if (propsProp === 'pdf') {
        ecosObj = ecosPdfDoc as EcosDocument
      } else if (propsProp === 'text') {
        ecosObj = ecosTextDoc as EcosDocument
      } else if (propsProp === 'video') {
        ecosObj.name = { ...ecosObj.name, type: 'video/mp4' }
        ecosObj.subtype = { ...ecosObj.subtype, mediaType: 9 }
      }
    } else if (u.isObj(propsProp)) {
      u.assign(ecosObj, propsProp)
    } else {
      ecosObj = ecosTextDoc as EcosDocument
    }

    return ecosObj as EcosDocument<N>
  }

  function getFoldedEmitObject<A extends EmitObjectFold>(
    ...args: Parameters<typeof emitObject>
  ) {
    return { emit: emitObject(...args) } as A
  }

  function emitObject<A extends EmitObject>({
    iteratorVar = 'itemObject',
    dataKey = { var1: iteratorVar },
    actions = [{}, {}, {}],
  }: {
    iteratorVar?: string
  } & Partial<EmitObject> = {}) {
    return { dataKey, actions } as A
  }

  function goto<A extends GotoObject>(props?: A['goto'] | Partial<A>) {
    const obj = builder.object()
    obj.createProperty('goto', props)
    return obj.build()
  }

  function ifObject(value?: IfObject | IfObject['if']): IfObject {
    if (u.isArr(value)) return { if: value }
    if (u.isObj(value)) return value
    return {
      if: [{}, 'selectOn.png', 'selectOff.png'],
    }
  }

  return {
    builtIn,
    ecosDoc,
    evalObject,
    emit: getFoldedEmitObject,
    goto,
    ifObject,
    pageJump,
    popUp,
    popUpDismiss,
    refresh,
    removeSignature,
    saveObject,
    saveSignature,
    toastObject,
    updateObject,
  }
})()

export default actionFactory
