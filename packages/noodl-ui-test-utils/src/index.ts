import { Action, createActionChain } from 'noodl-action-chain'
import { LiteralUnion, UnionToIntersection } from 'type-fest'
import {
  BuiltInActionObject,
  ButtonComponentObject,
  ComponentObject,
  ComponentType,
  DividerComponentObject,
  EmitObject,
  EvalActionObject,
  EventType,
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
  ComponentInstance,
  createComponent,
  EmitAction,
  NOODLUIAction,
  NOODLUIActionObject,
  NOODLUIActionObjectInput,
  NOODLUITrigger,
} from 'noodl-ui'
import * as T from './types'

type ComponentProps<C extends ComponentObject = ComponentObject> = Partial<
  { [K in NOODLUITrigger]: NOODLUIActionObjectInput[] } & C
>

export function getActionChain({
  actions,
  loader,
  load = true,
  trigger,
}: T.MockGetActionChainOptions) {
  let isExtendedActions = 'fn' in actions[0] || 'action' in actions[0]

  const getInstance = (obj: NOODLUIActionObject) => {
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

    return action as NOODLUIAction
  }

  const actionChain = createActionChain(
    trigger,
    (isExtendedActions
      ? actions.map(
          (o: { action: NOODLUIActionObject; fn: (...args: any[]) => any }) =>
            o.action,
        )
      : actions) as NOODLUIActionObject[],
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

export function getGenderListComponent({
  iteratorVar = 'itemObject',
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
  }
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
}): ComponentInstance {
  const result =
    typeof component === 'string'
      ? createComponent({ type: component })
      : createComponent(component)

  return result
}
