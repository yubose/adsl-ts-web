import * as u from '@jsmanifest/utils'
import type {
  ButtonComponentObject,
  CanvasComponentObject, // 9
  DividerComponentObject,
  EcosDocComponentObject,
  FooterComponentObject,
  HeaderComponentObject,
  ImageComponentObject,
  LabelComponentObject,
  ListComponentObject,
  ListItemComponentObject,
  PageComponentObject,
  PluginBodyTailComponentObject,
  PluginBodyTopComponentObject,
  PluginComponentObject,
  PluginHeadComponentObject,
  PopUpComponentObject,
  RegisterComponentObject,
  ScrollViewComponentObject,
  SelectComponentObject,
  TextFieldComponentObject,
  TextViewComponentObject,
  VideoComponentObject,
  ViewComponentObject,
} from 'noodl-types'
import { createComponentObject } from '../utils'
import actionFactory from './action'
import ecosJpgDoc from '../fixtures/jpg.json'
import ecosNoteDoc from '../fixtures/note.json'
import ecosPdfDoc from '../fixtures/pdf.json'
import ecosPngDoc from '../fixtures/png.json'
import ecosTextDoc from '../fixtures/text.json'
import * as t from '../types'

const componentFactory = (function () {
  function button<C extends ButtonComponentObject>(
    props?: C['text'] | Partial<C>,
  ) {
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
    return obj as C
  }

  function canvas<C extends CanvasComponentObject>(props?: C) {
    return {
      dataKey: 'SignIn.signature',
      ...props,
      type: 'canvas',
    } as CanvasComponentObject & C
  }

  function ecosDocComponent(
    preset?: t.GetEcosDocObjectPreset,
  ): EcosDocComponentObject
  function ecosDocComponent<C extends EcosDocComponentObject>(
    props?: Partial<C>,
  ): EcosDocComponentObject
  function ecosDocComponent<C extends EcosDocComponentObject>(
    props?: Partial<C> | t.GetEcosDocObjectPreset,
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
        u.assign(obj, props, {
          ecosObj: actionFactory.ecosDoc(props as any),
        })
      }
    }
    return obj
  }

  function divider<C extends DividerComponentObject>(
    props?: Partial<C>,
  ): DividerComponentObject {
    return { type: 'divider', ...props }
  }

  function footer<O extends Partial<FooterComponentObject>>(props?: O) {
    return { type: 'footer', ...props } as FooterComponentObject & O
  }

  function header<O extends Partial<HeaderComponentObject>>(props?: O) {
    return { type: 'header', ...props } as HeaderComponentObject & O
  }

  function image<
    O extends Partial<ImageComponentObject> = ImageComponentObject,
  >(obj?: O): ImageComponentObject & O

  function image<
    O extends Partial<ImageComponentObject> = ImageComponentObject,
  >(path?: O['path']): ImageComponentObject & O

  function image<O extends Partial<ImageComponentObject>>(obj?: O | O['path']) {
    u.isStr(obj) && (obj = { path: obj } as O)
    !obj && (obj = { path: 'abc.png' } as O)
    !('path' in (obj as O)) && (obj.path = 'abc.png')
    return { ...(obj as O), type: 'image' } as ImageComponentObject & O
  }

  function label<
    O extends Partial<LabelComponentObject> = LabelComponentObject,
  >(obj?: O): O & LabelComponentObject

  function label<
    O extends Partial<LabelComponentObject> = LabelComponentObject,
  >(text: O['text']): LabelComponentObject & O

  function label<
    O extends Partial<LabelComponentObject> = LabelComponentObject,
  >(obj?: string | O) {
    u.isStr(obj) && (obj = { text: obj } as O)
    !obj && (obj = { text: 'Hello' } as O)
    !('text' in obj) && (obj.text = 'Hello')
    return {
      ...obj,
      type: 'label',
    } as LabelComponentObject & O
  }

  function list<O extends Partial<ListComponentObject> = ListComponentObject>(
    { iteratorVar = 'itemObject', ...rest } = {} as O,
  ) {
    return {
      listObject: [
        { key: 'Gender', value: 'Male' },
        { key: 'Gender', value: 'Female' },
        { key: 'Gender', value: 'Other' },
      ],
      contentType: 'listObject',
      iteratorVar,
      children: [
        listItem({
          type: 'listItem',
          [iteratorVar]: '',
          children: [
            {
              type: 'label',
              dataKey: 'itemObject.value',
              style: { border: { style: '1' } },
            },
          ],
        }),
      ],
      ...rest,
      type: 'list',
    } as ListComponentObject & O
  }

  function listItem<IteratorVar extends string = string, DataObject = any>(
    iteratorVar: IteratorVar,
    dataObject?: DataObject,
  ): ListItemComponentObject & Partial<Record<IteratorVar, DataObject>>

  function listItem<O extends Partial<ListItemComponentObject>>(
    props: O,
  ): ListItemComponentObject & O

  function listItem<IteratorVar extends string = string, DataObject = any>(
    obj:
      | IteratorVar
      | (Partial<ListItemComponentObject> & {
          dataObject?: DataObject
          iteratorVar?: IteratorVar
        }) = {},
    dataObject?: DataObject,
  ) {
    u.isStr(obj) &&
      (obj = { [obj]: dataObject || '' } as ListItemComponentObject)
    return {
      style: { left: '0', border: { style: '1' } },
      children: [label(), view(), button()],
      ...obj,
      type: 'listItem',
    } as ListItemComponentObject & Record<IteratorVar, DataObject>
  }

  function page<P extends string>(path: P): PageComponentObject & { path: P }

  function page<O extends PageComponentObject>(
    obj: Partial<O>,
  ): O & PageComponentObject

  function page<O extends PageComponentObject = PageComponentObject>(
    obj: Partial<O> | PageComponentObject['path'],
  ) {
    if (u.isStr(obj)) return { type: 'page', path: obj } as O
    if (!obj) return { type: 'page', path: 'SignIn ' } as O
    return { ...obj, type: 'page' } as O
  }

  function plugin<C extends PluginComponentObject>(
    props?: Partial<C>,
  ): PluginComponentObject {
    return { type: 'plugin', path: 'googleTM.js', ...props }
  }

  function pluginHead<C extends PluginHeadComponentObject>(
    props?: Partial<C>,
  ): PluginHeadComponentObject {
    return { type: 'pluginHead', path: 'googleTM.js', ...props }
  }

  const pluginBodyTop = createComponentObject<PluginBodyTopComponentObject>(
    { type: 'pluginBodyTop', path: 'googleTM.js' } as any,
    'path',
  )

  const pluginBodyTail = createComponentObject<PluginBodyTailComponentObject>(
    { type: 'pluginBodyTail', path: 'googleTM.js' },
    'path',
  )

  const popUpComponent = createComponentObject<PopUpComponentObject>(
    { type: 'popUp', popUpView: 'genderView' },
    'popUpView',
  )

  const register = createComponentObject<RegisterComponentObject>(
    { type: 'register', onEvent: 'toggleCameraOn' },
    'onEvent',
  )

  function select<O extends any[]>(
    options: O,
  ): SelectComponentObject & { options: O }

  function select<O extends Partial<SelectComponentObject>>(
    props: Partial<O>,
  ): SelectComponentObject & O

  function select<O extends Partial<SelectComponentObject>>(props?: any[] | O) {
    const obj = {
      type: 'select',
      options: ['apple', 'orange', 'banana'],
    }
    if (u.isArr(props)) obj.options = props
    else if (props) u.assign(obj, props)
    return obj as O & SelectComponentObject
  }

  function scrollView<
    O extends Partial<ScrollViewComponentObject> = ScrollViewComponentObject,
  >(props?: O) {
    return { type: 'scrollView', ...props } as ScrollViewComponentObject & O
  }

  function textField<D extends string>(dataKey: D): TextFieldComponentObject

  function textField<O extends Partial<TextFieldComponentObject>>(
    obj?: O,
  ): TextFieldComponentObject & O

  function textField<
    O extends Partial<TextFieldComponentObject> = TextFieldComponentObject,
  >(props?: string | O) {
    u.isStr(props) && (props = { dataKey: props } as O)
    return {
      dataKey: 'formData.password',
      ...props,
      type: 'textField',
    } as TextFieldComponentObject & O
  }

  function textView<C extends TextViewComponentObject>(
    props?: Partial<C>,
  ): TextViewComponentObject {
    return { type: 'textView', ...props }
  }

  const video = createComponentObject<VideoComponentObject>(
    { type: 'video', videoFormat: 'video/mp4' },
    'path',
  )

  function view<O extends ViewComponentObject>(obj?: Partial<O>) {
    return {
      ...obj,
      type: 'view',
    }
  }

  return {
    button,
    canvas,
    ecosDocComponent,
    divider,
    footer,
    header,
    image,
    label,
    list,
    listItem,
    page,
    plugin,
    pluginHead,
    pluginBodyTop,
    pluginBodyTail,
    popUpComponent,
    register,
    select,
    scrollView,
    textField,
    textView,
    video,
    view,
  }
})()

export default componentFactory
