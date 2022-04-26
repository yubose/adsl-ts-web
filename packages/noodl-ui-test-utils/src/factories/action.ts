import * as u from '@jsmanifest/utils'
import type { PartialDeep } from 'type-fest'
import type {
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
  UpdateActionObject,
} from 'noodl-types'
import {
  Action as ActionBuilder,
  NoodlObject,
  Builder,
  EcosDoc,
  EcosDoc as EcosDocBuilder,
  EcosDocPreset,
} from 'noodl-builder'
import builder from '../builder'
import { mergeKeyValOrObj, objWithKeyOrUndef, strOrUndef } from '../utils'

const actionFactory = (function () {
  function builtIn(obj?: string | Partial<BuiltInActionObject>) {
    return mergeKeyValOrObj(
      builder.action('builtIn'),
      'funcName',
      strOrUndef(obj),
      obj,
    ).build()
  }

  function evalObject(
    obj?: EvalActionObject['object'] | Partial<EvalActionObject>,
  ) {
    return mergeKeyValOrObj(
      builder.action('evalObject'),
      'object',
      objWithKeyOrUndef(obj, 'object'),
      obj,
    ).build() as EvalActionObject
  }

  function pageJump(props?: string | Partial<PageJumpActionObject>) {
    return mergeKeyValOrObj(
      builder.action('pageJump'),
      'destination',
      strOrUndef(props),
      props,
    ).build() as PageJumpActionObject
  }

  function popUp(props?: string | Partial<PopupActionObject>) {
    return mergeKeyValOrObj(
      builder.action('popUp'),
      'popUpView',
      strOrUndef(props),
      props,
    ).build() as PopupActionObject
  }

  function popUpDismiss(props?: string | Partial<PopupDismissActionObject>) {
    return mergeKeyValOrObj(
      builder.action('popUpDismiss'),
      'popUpView',
      strOrUndef(props),
      props,
    ).build() as PopupDismissActionObject
  }

  function refresh<A extends RefreshActionObject>(props?: Partial<A>) {
    return builder.action('refresh').build()
  }

  function removeSignature<A extends Partial<RemoveSignatureActionObject>>(
    props?: A,
  ) {
    return builder
      .action('removeSignature')
      .createProperty('dataKey', props?.dataKey)
      .createProperty('dataObject', props?.dataObject)
      .build() as RemoveSignatureActionObject
  }

  function saveSignature<A extends Partial<SaveSignatureActionObject>>(
    props?: A,
  ) {
    return builder
      .action('saveSignature')
      .createProperty('dataKey', props?.dataKey)
      .createProperty('dataObject', props?.dataObject)
      .build() as SaveSignatureActionObject
  }

  function saveObject<A extends SaveActionObject>(props?: Partial<A>) {
    return builder
      .action('saveObject')
      .createProperty('object', u.isStr(props) ? props : props?.object)
      .build() as A
  }

  function updateObject<A extends UpdateActionObject>(props?: A) {
    return builder
      .action('updateObject')
      .createProperty('object', u.isStr(props) ? props : props?.object)
      .build() as A
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
  function ecosDoc<N extends NameField>(preset?: EcosDocPreset): EcosDocument<N>
  /**
   * Generate an eCOS document object
   * @param propsProp - eCOS document preset or component props
   * @returns { EcosDocument }
   */
  function ecosDoc<N extends NameField>(
    propsProp?: EcosDocPreset | PartialDeep<EcosDocument<N>>,
  ): EcosDocument<N> {
    const component = builder.component('ecosDoc"')
    const ecosDoc = builder.ecosDoc()

    if (u.isStr(propsProp)) {
      ecosDoc.usePreset(propsProp as EcosDocPreset)
    } else if (u.isObj(propsProp)) {
      mergeKeyValOrObj(ecosDoc, propsProp)
    } else {
      ecosDoc.usePreset('text')
    }

    return component
      .createProperty('ecosObj', ecosDoc.build() as EcosDocument<N>)
      .build()
  }

  function getFoldedEmitObject<A extends EmitObjectFold>(
    ...args: Parameters<typeof emitObject>
  ) {
    const obj = builder.object().createProperty('emit', emitObject(...args))
    return obj.build() as A
  }

  function emitObject<A extends EmitObject>({
    iteratorVar = 'itemObject',
    dataKey,
    actions,
  }: {
    iteratorVar?: string
  } & Partial<EmitObject> = {}) {
    const emit = builder.object().createProperty('emit')
    const emitObject = emit.getProperty('emit')
    return emit.build()
  }

  function goto<A extends GotoObject>(props?: A['goto'] | Partial<A>) {
    return mergeKeyValOrObj(builder.object(), 'goto', props).build()
  }

  function ifObject(value?: IfObject | IfObject['if']) {
    const obj = builder.object()
    if (u.isArr(value)) obj.createProperty('if', value)
    else if (u.isObj(value)) obj.createProperty('if', value.if)
    return obj.build() as IfObject
  }

  return {
    builtIn,
    ecosDoc,
    evalObject,
    emitObject: getFoldedEmitObject,
    goto,
    ifObject,
    pageJump,
    popUp,
    popUpDismiss,
    refresh,
    removeSignature,
    saveObject,
    saveSignature,
    updateObject,
  }
})()

export default actionFactory
