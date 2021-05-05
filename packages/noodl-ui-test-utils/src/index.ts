import { Action, createActionChain } from 'noodl-action-chain'
import { LiteralUnion, PartialDeep, SetOptional } from 'type-fest'
import {
  ActionObject,
  BuiltInActionObject,
  ButtonComponentObject,
  ComponentObject,
  DividerComponentObject,
  EcosDocComponentObject,
  EcosDocument,
  EmitObject,
  EvalActionObject,
  FooterComponentObject,
  GotoObject,
  HeaderComponentObject,
  Identify,
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
  PluginComponentObject,
  PluginHeadComponentObject,
  PopupActionObject,
  PopUpComponentObject,
  PopupDismissActionObject,
  RefreshActionObject,
  RegisterComponentObject,
  SaveActionObject,
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
  EmitAction,
  NUIAction,
  NUIActionObject,
  NUIActionObjectInput,
  NUITrigger,
} from 'noodl-ui'
import * as T from './types'

type CreateWithKeyOrProps<
  Obj extends Record<string, any> = Record<string, any>,
  Key extends keyof Obj = keyof Obj
> = {
  //
}

const createEval = createActionWithKeyOrProps<NUIActionObject>(
  {
    actionType: '',
    popUpView: 'agoawf.html',
  },
  '',
)

const evalObject = createEval('')

function createObjWithKeyOrProps<Obj extends Record<string, any>>(
  defaultProps: Partial<Obj>,
) {
  const create = <Key extends keyof Obj>(
    key: Key | Obj[Key] | Partial<Obj>,
    props?: CreateWithKeyOrProps<Obj, Key>,
  ): Obj => {
    const obj = { ...defaultProps } as any
    if (typeof key === 'string') key === ''
    else key
    if (typeof props === 'string') obj[key] = props
    else if (props) Object.assign(obj, props)
    return obj as Obj
  }
  return create
}

function createActionWithKeyOrProps<O extends NUIActionObjectInput>(
  defaultProps: O,
  key: keyof O,
) {
  const createObj = (props?: string | ActionProps<O>): O => {
    const obj = { ...defaultProps } as NUIActionObjectInput
    if (typeof key === 'string') obj[key] = props
    else if (props) Object.assign(obj, props)
    return obj as O
  }
  return createObj
}

function createComponentWithKeyOrProps<O extends ComponentObject>(
  defaultProps: O,
  key: string,
) {
  const createObj = (props?: string | ComponentProps<O>): O => {
    const obj = { ...defaultProps } as ComponentObject
    if (typeof key === 'string') obj[key] = props
    else if (props) Object.assign(obj, props)
    return obj as O
  }
  return createObj
}

type ActionProps<C extends Partial<ActionObject> = ActionObject> = Partial<C>

type ComponentProps<
  C extends Partial<ComponentObject> = ComponentObject
> = Partial<{ [K in NUITrigger]: NUIActionObjectInput[] } & C>

export function getActionChain({
  actions,
  loader,
  load = true,
  trigger,
}: T.MockGetActionChainOptions) {
  let isExtendedActions = 'fn' in actions[0] || 'action' in actions[0]

  const getInstance = (obj: NUIActionObject) => {
    const action = Identify.emit(obj)
      ? new EmitAction(trigger, obj)
      : new Action(trigger, obj)

    if (isExtendedActions) {
      const o = actions.find(
        (o: T.MockGetActionChainExtendedActionsArg) => o.action === obj,
      ) as T.MockGetActionChainExtendedActionsArg
      // Convenience if they want to provide spies
      typeof o?.fn === 'function' && (action.executor = o.fn)
    }

    return action as NUIAction
  }

  const actionChain = createActionChain(
    trigger,
    (isExtendedActions
      ? actions.map(
          (o: { action: NUIActionObject; fn: (...args: any[]) => any }) =>
            o.action,
        )
      : actions) as NUIActionObject[],
    (actions) => (loader ? loader(actions) : actions.map(getInstance)) as any,
  )

  load && actionChain.loadQueue()
  return actionChain
}

export const getBuiltInAction = createActionWithKeyOrProps<BuiltInActionObject>(
  { actionType: 'builtIn', funcName: 'hello' },
  'funcName',
)

export function getEvalObjectAction(
  props?: Partial<EvalActionObject>,
): EvalActionObject {
  return { actionType: 'evalObject', object: {}, ...props }
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

export function getSaveObjectAction(
  props?: Partial<SaveActionObject>,
): SaveActionObject {
  return { actionType: 'saveObject', object: {}, ...props }
}

export function getToastObject(
  props?: Partial<ToastObject>,
): { toast: ToastObject } {
  return { toast: { message: 'hello!', style: {}, ...props } }
}

export function getUpdateObjectAction(props?: Partial<UpdateActionObject>) {
  return {
    actionType: 'updateObject',
    object: { '.Global.refid@': '___.itemObject.id' },
    ...props,
  }
}

export function getEcosDocObject(
  preset?: 'image' | 'pdf' | 'text' | 'video',
): EcosDocument<NameField.Base>
export function getEcosDocObject<NameField extends NameField.Base>(
  propsProp?: PartialDeep<EcosDocument<NameField>>,
): EcosDocument<NameField>
export function getEcosDocObject<NameField extends NameField.Base>(
  propsProp?:
    | 'audio'
    | 'docx'
    | 'image'
    | 'message'
    | 'pdf'
    | 'text'
    | 'video'
    | PartialDeep<EcosDocument<NameField>>,
): EcosDocument<NameField> {
  const props = {
    name: { data: `blob:http://a0242fasa141inmfakmf24242`, type: '' },
  } as Partial<EcosDocument<NameField.Base>>

  if (typeof propsProp === 'string') {
    //
  } else {
    Object.assign(props, propsProp)
  }

  if (typeof propsProp === 'string') {
    if (propsProp === 'audio') {
      props.name = { ...props.name, type: 'audio/wav' }
      props.subtype = { ...props.subtype, mediaType: 2 }
    } else if (propsProp === 'docx') {
      props.name = { ...props.name, type: 'application/vnl.' }
      props.subtype = { ...props.subtype, mediaType: 1 }
    } else if (propsProp === 'image') {
      props.name = { ...props.name, type: 'image/png' }
      props.subtype = { ...props.subtype, mediaType: 4 }
    } else if (propsProp === 'message') {
      // props.name = { ...props.name, type: '', }
      props.subtype = { ...props.subtype, mediaType: 5 }
    } else if (propsProp === 'pdf') {
      props.name = { ...props.name, type: 'application/pdf' }
      props.subtype = { ...props.subtype, mediaType: 1 }
    } else if (propsProp === 'text') {
      props.name = {
        ...props.name,
        title: `This is the title`,
        content: `Sample content from a text document`,
        type: 'text/plain',
      }
      props.subtype = { ...props.subtype, mediaType: 0 }
      delete props.name?.data
    } else if (propsProp === 'video') {
      props.name = { ...props.name, type: 'video/mp4' }
      props.subtype = { ...props.subtype, mediaType: 9 }
    }
  }

  const ecosObj = {
    id: '2EUC92bOSjFIOVhlF5mtLQ==',
    ctime: 1619719574,
    mtime: 1619719574,
    atime: 1619719574,
    atimes: 1,
    tage: 0,
    type: 1025,
    deat: {
      url:
        'https://s3.us-east-2.amazonaws.com/ecos.aitmed.com/6Kz7B6XdVHCCHoF12YzDM8/8mYaanEkGyrsfWHh1BDGCq/9sg86udSxhwezsA4g93TQ8',
      sig: null,
      exptime: null,
    },
    size: 89937,
    fid: 'R9xoaHI8TEjWWH6FTFo0VQ==',
    eid: 'PugoYpm8TLq2skvLQNsPSg==',
    bsig: 'KyRGNeLKTPscmfAfMyKktw==',
    esig: 'PugoYpm8TLq2skvLQNsPSg==',
    created_at: 1619719574000,
    modified_at: 1619719574000,
    ...props,
    name: {
      title: 'jpg',
      tags: ['coffee', 'drink'],
      type: 'image/jpeg',
      user: 'Johnny Bravo',
      data: 'blob:http://127.0.0.1:3000/660f7f76-c1d8-4103-825a-048b6adea785',
      ...props.name,
    },
    subtype: {
      isOnServer: false,
      isZipped: true,
      isBinary: false,
      isEncrypted: true,
      isEditable: true,
      applicationDataType: 0,
      mediaType: 4,
      size: 89937,
      ...(props.subtype || undefined),
    },
  } as EcosDocument<NameField>
  return ecosObj
}

export function getEmitObject({
  iteratorVar = 'itemObject',
  dataKey = { var1: iteratorVar },
  actions = [{}, {}, {}],
}: {
  iteratorVar?: string
} & Partial<EmitObject> = {}): EmitObject {
  return {
    emit: { dataKey, actions },
  }
}

export function getGotoObject(
  props?: string | Partial<GotoObject>,
): GotoObject {
  const obj = { goto: 'PatientDashboard' } as GotoObject
  if (typeof props === 'string') obj.goto = props
  else if (props) Object.assign(obj, props)
  return obj
}

export function getButtonComponent(
  props?: string | ComponentProps<ButtonComponentObject>,
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
  if (typeof props === 'string') obj.text = props
  else if (props) Object.assign(obj, props)
  return obj
}

export function getEcosDocComponent(
  props?: ComponentProps<EcosDocComponentObject>,
): EcosDocComponentObject {
  return {
    type: 'ecosDoc',
    ...props,
    ecosObj: getEcosDocObject(props?.ecosObj),
  }
}

export function getDividerComponent(
  props?: ComponentProps<DividerComponentObject>,
): DividerComponentObject {
  return { type: 'divider', ...props }
}

export function getFooterComponent(
  props?: ComponentProps<FooterComponentObject>,
): FooterComponentObject {
  return { type: 'footer', ...props }
}

export function getHeaderComponent(
  props?: ComponentProps<HeaderComponentObject>,
): HeaderComponentObject {
  return { type: 'header', ...props }
}

export function getImageComponent(
  args: string | ComponentProps<ImageComponentObject> = {},
): ImageComponentObject {
  const obj = { type: 'image', path: 'abc.png' } as ImageComponentObject
  if (typeof args === 'string') obj.path = args
  else if (args) Object.assign(obj, args)
  return obj
}

export function getLabelComponent(
  props?: ComponentProps<LabelComponentObject> & {
    dataKey?: string
    placeholder?: string
    text?: string
    textBoard?: TextBoardObject
  },
): LabelComponentObject {
  return {
    type: 'label',
    text: 'J',
    dataKey: 'formData.firstName',
    style: { border: { style: '1' } },
    ...props,
  }
}

export function getListComponent({
  iteratorVar = 'itemObject',
  ...rest
}: ComponentProps<ListComponentObject> & {
  contentType?: string
  iteratorVar?: string
  listObject?: any[]
} = {}): ListComponentObject {
  return {
    type: 'list',
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
  }
}

export function getListItemComponent({
  iteratorVar = 'itemObject',
  dataObject,
  ...rest
}: ComponentProps<ListItemComponentObject> & {
  dataObject?: any
  iteratorVar?: string
} = {}): ListItemComponentObject {
  return {
    type: 'listItem',
    [iteratorVar]: dataObject || '',
    style: { left: '0', border: { style: '1' } },
    children: [
      getLabelComponent(),
      getViewComponent({
        addChildren: [
          getViewComponent({
            addChildren: [getViewComponent()],
          } as any),
        ],
      } as any),
      getButtonComponent(),
    ],
    ...rest,
  }
}

export function getPageComponent(
  props?: ComponentProps<PageComponentObject> & { path?: string },
): PageComponentObject {
  return { type: 'page', path: 'SignIn', ...props }
}

export function getPluginComponent(
  props?: ComponentProps<PluginComponentObject> & { path?: string },
): PluginComponentObject {
  return { type: 'plugin', path: 'googleTM.js', ...props }
}

export function getPluginHeadComponent(
  props?: ComponentProps<PluginHeadComponentObject> & { path?: string },
): PluginHeadComponentObject {
  return { type: 'pluginHead', path: 'googleTM.js', ...props }
}

export const getPluginBodyTopComponent = createComponentWithKeyOrProps<PluginBodyTailComponentObject>(
  { type: 'pluginBodyTop', path: 'googleTM.js' } as any,
  'path',
)

export const getPluginBodyTail = createComponentWithKeyOrProps<PluginBodyTailComponentObject>(
  { type: 'pluginBodyTail', path: 'googleTM.js' },
  'path',
)

export const getPopUpComponent = createComponentWithKeyOrProps<PopUpComponentObject>(
  { type: 'popUp', popUpView: 'genderView' },
  'popUpView',
)

export const getRegisterComponent = createComponentWithKeyOrProps<RegisterComponentObject>(
  { type: 'register', onEvent: 'toggleCameraOn' },
  'onEvent',
)

export function getSelectComponent(
  props?:
    | Record<string, any>[]
    | (ComponentProps<SelectComponentObject> & { options?: string[] }),
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
  props?: ComponentProps<ScrollViewComponentObject>,
): ScrollViewComponentObject {
  return { type: 'scrollView', ...props }
}

export function getTextFieldComponent(
  props?: ComponentProps<TextFieldComponentObject> & {
    placeholder?: EmitObject | Path
    dataKey?: string
  },
): TextFieldComponentObject {
  return {
    type: 'textField',
    placeholder: 'Enter your name',
    dataKey: 'formData.password',
    ...props,
  }
}

export function getTextViewComponent(
  props?: ComponentProps<TextViewComponentObject>,
): TextViewComponentObject {
  return { type: 'textView', ...props }
}

export const getVideoComponent = createComponentWithKeyOrProps<VideoComponentObject>(
  { type: 'video', videoFormat: 'video/mp4' },
  'path',
)

export function getViewComponent({
  addChildren = [],
  children,
  ...rest
}: ComponentProps<ViewComponentObject> & {
  addChildren?: ComponentObject[]
} = {}): ViewComponentObject {
  return {
    type: 'view',
    viewTag: 'subStream',
    required: false,
    style: { fontStyle: 'bold', height: '0.15', borderRadius: '5' },
    children: children || [getLabelComponent(), ...addChildren],
    ...rest,
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
