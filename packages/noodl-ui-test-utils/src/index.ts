import { Action, createActionChain } from 'noodl-action-chain'
import {
  BuiltInActionObject,
  ButtonComponentObject,
  ComponentObject,
  ComponentType,
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
  createComponent,
  EmitAction,
  NUIAction,
  NUIActionObject,
  NUIActionObjectInput,
  NUITrigger,
  NUIComponent,
} from 'noodl-ui'
import * as T from './types'

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

export function getBuiltInAction(
  props?: Partial<BuiltInActionObject>,
): BuiltInActionObject {
  return {
    actionType: 'builtIn',
    funcName: 'hello',
    ...props,
  }
}

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
  props?: Partial<PopupActionObject>,
): PopupActionObject {
  return { actionType: 'popUp', popUpView: 'genderView', ...props }
}

export function getPopUpDismissAction(
  props?: Partial<PopupDismissActionObject>,
): PopupDismissActionObject {
  return { actionType: 'popUpDismiss', popUpView: 'warningView', ...props }
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

export function getEcosDocObject<
  NameField extends { type: string } = { type: string } & { [key: string]: any }
>(props?: Partial<EcosDocument>): EcosDocument<NameField> {
  return {
    id: '2EUC92bOSjFIOVhlF5mtLQ==',
    ctime: 1619719574,
    mtime: 1619719574,
    atime: 1619719574,
    atimes: 1,
    tage: 0,
    subtype: {
      isOnServer: false,
      isZipped: true,
      isBinary: false,
      isEncrypted: true,
      isEditable: true,
      applicationDataType: 0,
      mediaType: 4,
      size: 89937,
    },
    type: 1025,
    name: {
      title: 'jpg',
      tags: ['coffee', 'drink'],
      type: 'image/jpeg',
      user: 'Johnny Bravo',
      data: 'blob:http://127.0.0.1:3000/660f7f76-c1d8-4103-825a-048b6adea785',
    },
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
  }
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

export function getGotoObject(props?: Partial<GotoObject>): GotoObject {
  return { goto: 'PatientDashboard', ...props }
}

export function getButtonComponent(
  props?: ComponentProps<ButtonComponentObject>,
): ButtonComponentObject {
  return {
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
    ...props,
  }
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

export function getImageComponent({
  path = 'abc.png' as any,
  ...rest
}: ComponentProps<ImageComponentObject> = {}): ImageComponentObject {
  return {
    type: 'image',
    path,
    ...rest,
  }
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

export function getPluginBodyTailComponent(
  props?: ComponentProps<PluginBodyTailComponentObject> & { path?: string },
): PluginBodyTailComponentObject {
  return { type: 'pluginBodyTail', path: 'googleTM.js', ...props }
}

export function getPopUpComponent(
  props?: ComponentProps<PopUpComponentObject> & { popUpView?: string },
): PopUpComponentObject {
  return { type: 'popUp', popUpView: 'genderView', ...props }
}

export function getRegisterComponent(
  props?: ComponentProps<RegisterComponentObject> & { onEvent?: string },
): RegisterComponentObject {
  return {
    type: 'register',
    onEvent: props?.onEvent || 'ToggleCameraOn',
    ...props,
  }
}

export function getSelectComponent(
  props?: ComponentProps<SelectComponentObject> & { options?: string[] },
): SelectComponentObject {
  return { type: 'select', options: ['apple', 'orange', 'banana'], ...props }
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

export function getVideoComponent(
  props?: ComponentProps<VideoComponentObject> & { videoFormat?: string },
): VideoComponentObject {
  return {
    type: 'video',
    videoFormat: props?.videoFormat || 'video/mp4',
    ...props,
  }
}

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

export function getComponentInstance({
  component,
}: {
  component: ComponentObject | ComponentType
}): NUIComponent.Instance {
  const result =
    typeof component === 'string'
      ? createComponent({ type: component })
      : createComponent(component)

  return result
}
