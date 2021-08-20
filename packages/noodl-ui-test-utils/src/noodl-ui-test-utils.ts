import * as u from '@jsmanifest/utils'
import { PartialDeep } from 'type-fest'
import {
  BuiltInActionObject,
  ButtonComponentObject,
  CanvasComponentObject, // 9
  DividerComponentObject,
  EcosDocComponentObject,
  EcosDocument,
  EmitObject,
  EmitObjectFold,
  EvalActionObject,
  FooterComponentObject,
  GotoObject,
  HeaderComponentObject,
  IfObject,
  ImageComponentObject,
  LabelComponentObject,
  ListComponentObject,
  ListItemComponentObject,
  NameField,
  PageComponentObject,
  PageJumpActionObject,
  Path,
  PluginBodyTailComponentObject,
  PluginBodyTopComponentObject,
  PluginComponentObject,
  PluginHeadComponentObject,
  PopupActionObject,
  PopUpComponentObject,
  PopupDismissActionObject,
  RefreshActionObject,
  RegisterComponentObject,
  RemoveSignatureActionObject,
  SaveActionObject,
  SaveSignatureActionObject,
  ScrollViewComponentObject,
  SelectComponentObject,
  TextBoardObject,
  TextFieldComponentObject,
  TextViewComponentObject,
  ToastObject,
  UpdateActionObject,
  VideoComponentObject,
  ViewComponentObject,
} from 'noodl-types'
import {
  ComponentProps,
  createActionObject_next,
  createComponentObject,
} from './utils'
import ecosJpgDoc from './fixtures/jpg.json'
import ecosNoteDoc from './fixtures/note.json'
import ecosPdfDoc from './fixtures/pdf.json'
import ecosPngDoc from './fixtures/png.json'
import ecosTextDoc from './fixtures/text.json'

export function getBuiltInAction(obj?: string | Partial<BuiltInActionObject>) {
  u.isStr(obj) && (obj = { funcName: obj } as BuiltInActionObject)
  return createActionObject_next('builtIn')({
    ...obj,
    funcName: obj?.funcName || 'redraw',
  })
}

export function getEvalObjectAction(
  obj?: EvalActionObject['object'] | Partial<EvalActionObject>,
): EvalActionObject {
  !obj && (obj = { actionType: 'evalObject', object: getIfObject() })
  !('actionType' in obj) &&
    (obj = { actionType: 'evalObject', object: obj['object'] })
  return createActionObject_next('evalObject')({
    ...obj,
    object: obj['object'],
  })
}

export function getPageJumpAction(
  props?: Partial<PageJumpActionObject>,
): PageJumpActionObject {
  return { actionType: 'pageJump', destination: 'SignIn', ...props }
}

export function getPopUpAction(
  props?: string | Partial<PopupActionObject>,
): PopupActionObject {
  const obj = {
    actionType: 'popUp',
    popUpView: 'genderView',
  } as PopupActionObject
  if (typeof props === 'string') obj.popUpView = props
  else if (props) Object.assign(obj, props)
  return obj
}

export function getPopUpDismissAction(
  props?: string | Partial<PopupDismissActionObject>,
): PopupDismissActionObject {
  const obj = {
    actionType: 'popUpDismiss',
    popUpView: 'helloView',
  } as PopupDismissActionObject
  if (typeof props === 'string') obj.popUpView = props
  else Object.assign(obj, props)
  return obj
}

export function getRefreshAction(
  props?: Partial<RefreshActionObject>,
): RefreshActionObject {
  return { actionType: 'refresh', ...props }
}

export function getRemoveSignatureAction(
  props?: Partial<RemoveSignatureActionObject>,
): RemoveSignatureActionObject {
  return {
    actionType: 'removeSignature',
    dataKey: 'SignIn.signature',
    dataObject: 'BLOB',
    ...props,
  }
}

export function getSaveSignatureAction(
  props?: Partial<SaveSignatureActionObject>,
): SaveSignatureActionObject {
  return {
    actionType: 'saveSignature',
    dataKey: 'SignIn.signature',
    dataObject: 'BLOB',
    ...props,
  }
}

export function getSaveObjectAction(
  props?: Partial<SaveActionObject>,
): SaveActionObject {
  return { actionType: 'saveObject', object: {}, ...props }
}

export function getToastObject(props?: Partial<ToastObject>): {
  toast: ToastObject
} {
  return { toast: { message: 'hello!', style: {}, ...props } }
}

export function getUpdateObjectAction(props?: Partial<UpdateActionObject>) {
  return {
    actionType: 'updateObject',
    object: { '.Global.refid@': '___.itemObject.id' },
    ...props,
  }
}

type GetEcosDocObjectPreset =
  | 'audio'
  | 'docx'
  | 'image'
  | 'message'
  | 'note'
  | 'pdf'
  | 'text'
  | 'video'

/**
 * Generate an eCOS document object by component props
 */
export function getEcosDocObject<N extends NameField>(
  propsProp?: PartialDeep<EcosDocument<N>>,
): EcosDocument<N>
/**
 * Generate an eCOS document object by preset
 */
export function getEcosDocObject<N extends NameField>(
  preset?: GetEcosDocObjectPreset,
): EcosDocument<N>
/**
 * Generate an eCOS document object
 * @param propsProp - eCOS document preset or component props
 * @returns { EcosDocument }
 */
export function getEcosDocObject<N extends NameField>(
  propsProp?: GetEcosDocObjectPreset | PartialDeep<EcosDocument<N>>,
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

export function getFoldedEmitObject(...args: Parameters<typeof getEmitObject>) {
  return { emit: getEmitObject(...args) } as EmitObjectFold
}

export function getEmitObject({
  iteratorVar = 'itemObject',
  dataKey = { var1: iteratorVar },
  actions = [{}, {}, {}],
}: {
  iteratorVar?: string
} & Partial<EmitObject> = {}) {
  return { dataKey, actions } as EmitObject
}

export function getGotoObject(
  props?: string | Partial<GotoObject>,
): GotoObject {
  const obj = { goto: 'PatientDashboard' } as GotoObject
  if (typeof props === 'string') obj.goto = props
  else if (props) Object.assign(obj, props)
  return obj
}

export function getButtonComponent<C extends ButtonComponentObject>(
  props?: string | ComponentProps<Partial<C>>,
): ButtonComponentObject {
  const obj = {
    type: 'button',
    onClick: [
      {
        actionType: 'updateObject',
        dataKey: 'MeetingLobbyStart.inviteesInfo.edge',
        dataObject: 'itemObject',
      },
      {
        actionType: 'evalObject',
        object: { '..inviteesInfo.edge.tage@': -1 },
      },
    ],
    text: 'Delete',
  } as ButtonComponentObject
  if (u.isStr(props)) obj.text = props
  else if (props) u.assign(obj, props)
  return obj
}

export function getCanvasComponent(
  props?: string | ComponentProps<Partial<CanvasComponentObject>>,
) {
  const obj = {
    type: 'canvas',
    dataKey: 'SignIn.signature',
  } as CanvasComponentObject
  if (u.isStr(props)) obj.text = props
  else if (props) u.assign(obj, props)
  return obj
}

export function getEcosDocComponent(
  preset?: GetEcosDocObjectPreset,
): EcosDocComponentObject
export function getEcosDocComponent(
  props?: ComponentProps<Partial<EcosDocComponentObject>>,
): EcosDocComponentObject
export function getEcosDocComponent(
  props?:
    | ComponentProps<Partial<EcosDocComponentObject>>
    | GetEcosDocObjectPreset,
): EcosDocComponentObject {
  const obj = { type: 'ecosDoc' } as EcosDocComponentObject
  if (u.isStr(props)) {
    if (props === 'image') {
      obj.ecosObj = ecosPngDoc || ecosJpgDoc
    } else if (props === 'note') {
      obj.ecosObj = ecosNoteDoc
    } else if (props === 'pdf') {
      obj.ecosObj = ecosPdfDoc
    } else if (props === 'text') {
      obj.ecosObj = ecosTextDoc
    }
  } else if (u.isObj(props)) {
    if ('ecosObj' in props) {
      u.assign(obj, props)
    } else {
      u.assign(obj, props, { ecosObj: getEcosDocObject(props as any) })
    }
  }
  return obj
}

export function getDividerComponent(
  props?: ComponentProps<Partial<DividerComponentObject>>,
): DividerComponentObject {
  return { type: 'divider', ...props }
}

export function getFooterComponent(
  props?: ComponentProps<Partial<FooterComponentObject>>,
): FooterComponentObject {
  return { type: 'footer', ...props }
}

export function getHeaderComponent(
  props?: ComponentProps<Partial<HeaderComponentObject>>,
): HeaderComponentObject {
  return { type: 'header', ...props }
}

export function getImageComponent(
  args:
    | string
    | ComponentProps<Partial<ImageComponentObject>> = {} as ComponentProps<
    Partial<ImageComponentObject>
  >,
): ImageComponentObject {
  const obj = { type: 'image', path: 'abc.png' } as ImageComponentObject
  if (typeof args === 'string') obj.path = args
  else if (args) Object.assign(obj, args)
  return obj
}

export const getLabelComponent = createComponentObject<
  LabelComponentObject & {
    dataKey?: string
    placeholder?: string
    text?: string
    textBoard?: TextBoardObject
  }
>(
  {
    type: 'label',
    text: 'J',
    dataKey: 'formData.firstName',
    style: { border: { style: '1' } },
  },
  'text',
)

export function getListComponent(
  {
    iteratorVar = 'itemObject',
    ...rest
  }: ComponentProps<Partial<ListComponentObject>> & {
    contentType?: string
    iteratorVar?: string
    listObject?: any[]
  } = {} as ComponentProps<Partial<ListComponentObject>>,
): ListComponentObject {
  return {
    listObject: getGenderListObject(),
    contentType: 'listObject',
    iteratorVar,
    children: [
      {
        type: 'listItem',
        [iteratorVar]: '',
        children: [
          {
            type: 'label',
            dataKey: 'itemObject.value',
            style: { border: { style: '1' } },
          },
        ],
      },
    ],
    ...rest,
    type: 'list',
  }
}

export function getListItemComponent(
  {
    iteratorVar = 'itemObject',
    dataObject,
    ...rest
  }: ComponentProps<Partial<ListItemComponentObject>> & {
    dataObject?: any
    iteratorVar?: string
  } = {} as any,
): ListItemComponentObject {
  return {
    [iteratorVar]: dataObject || '',
    style: { left: '0', border: { style: '1' } },
    children: [getLabelComponent(), getViewComponent(), getButtonComponent()],
    ...rest,
    type: 'listItem',
  }
}

export const getPageComponent = createComponentObject<PageComponentObject>(
  { type: 'page', path: 'SignIn' },
  'path',
)

export function getPluginComponent(
  props?: ComponentProps<Partial<PluginComponentObject>> & { path?: string },
): PluginComponentObject {
  return { type: 'plugin', path: 'googleTM.js', ...props }
}

export function getPluginHeadComponent(
  props?: ComponentProps<Partial<PluginHeadComponentObject>> & {
    path?: string
  },
): PluginHeadComponentObject {
  return { type: 'pluginHead', path: 'googleTM.js', ...props }
}

export const getPluginBodyTopComponent =
  createComponentObject<PluginBodyTopComponentObject>(
    { type: 'pluginBodyTop', path: 'googleTM.js' } as any,
    'path',
  )

export const getPluginBodyTailComponent =
  createComponentObject<PluginBodyTailComponentObject>(
    { type: 'pluginBodyTail', path: 'googleTM.js' },
    'path',
  )

export const getPopUpComponent = createComponentObject<PopUpComponentObject>(
  { type: 'popUp', popUpView: 'genderView' },
  'popUpView',
)

export const getRegisterComponent =
  createComponentObject<RegisterComponentObject>(
    { type: 'register', onEvent: 'toggleCameraOn' },
    'onEvent',
  )

export function getSelectComponent(
  props?:
    | Record<string, any>[]
    | (ComponentProps<Partial<SelectComponentObject>> & { options?: string[] }),
): SelectComponentObject {
  const obj = {
    type: 'select',
    options: ['apple', 'orange', 'banana'],
  } as SelectComponentObject
  if (Array.isArray(props)) obj.options = props
  else if (props) Object.assign(obj, props)
  return obj
}

export function getScrollViewComponent(
  props?: ComponentProps<Partial<ScrollViewComponentObject>>,
): ScrollViewComponentObject {
  return { type: 'scrollView', ...props }
}

export function getTextFieldComponent(
  props?: ComponentProps<
    Partial<TextFieldComponentObject> & {
      placeholder?: Path
      dataKey?: string
    }
  >,
): TextFieldComponentObject {
  return {
    type: 'textField',
    placeholder: 'Enter your name',
    dataKey: 'formData.password',
    ...props,
  }
}

export function getTextViewComponent(
  props?: ComponentProps<Partial<TextViewComponentObject>>,
): TextViewComponentObject {
  return { type: 'textView', ...props }
}

export const getVideoComponent = createComponentObject<VideoComponentObject>(
  { type: 'video', videoFormat: 'video/mp4' },
  'path',
)

export function getViewComponent(
  {
    children = [],
    ...rest
  }: ComponentProps<Partial<ViewComponentObject>> = {} as any,
): ViewComponentObject {
  return {
    children,
    ...rest,
    type: 'view',
  }
}

export function getGenderListObject() {
  return [
    { key: 'Gender', value: 'Male' },
    { key: 'Gender', value: 'Female' },
    { key: 'Gender', value: 'Other' },
  ]
}

export function getIfObject({ iteratorVar = 'itemObject' } = {}): IfObject {
  return {
    if: [
      {
        '.builtIn.object.has': [
          { object: '..formData' },
          { key: `${iteratorVar}.key` },
        ],
      },
      'selectOn.png',
      'selectOff.png',
    ],
  }
}
