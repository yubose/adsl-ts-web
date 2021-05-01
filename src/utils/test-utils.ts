import { EventEmitter } from 'events'
import { Status } from '@aitmed/ecos-lvl2-sdk'
import { LocalParticipant } from 'twilio-video'
import CADL from '@aitmed/cadl'
import noop from 'lodash/noop'
import produce, { Draft } from 'immer'
import { ComponentObject, PageObject } from 'noodl-types'
import NOODLDOM, {
  defaultResolvers,
  Page as NOODLDOMPage,
  Resolve,
  Transaction,
} from 'noodl-ui-dom'
import {
  actionTypes as nuiActionTypes,
  nuiGroupedActionTypes,
  nuiEmitTransaction,
  NUI,
  NUIActionType,
  NUIComponent,
  Page as NUIPage,
  Viewport,
  Store,
  NUITrigger,
  NUIActionGroupedType,
  Register,
  NUIActionObjectInput,
} from 'noodl-ui'
import App from '../App'
import createActions from '../handlers/actions'
import createBuiltIns from '../handlers/builtIns'
import getMockRoom, { MockRoom } from '../__tests__/helpers/getMockRoom'
import getVideoChatPage from '../__tests__/helpers/getVideoChatPage'
import getMockParticipant, {
  MockParticipant,
} from '../__tests__/helpers/getMockParticipant'
import * as c from '../constants'
import * as u from './common'
import { LiteralUnion } from 'type-fest'

export const deviceSize = {
  galaxys5: { width: 360, height: 640, aspectRatio: 0.5621345029239766 },
  iphone6: { width: 375, height: 667, aspectRatio: 0.562545720555962 },
  ipad: { width: 768, height: 1024, aspectRatio: 0.7495126705653021 },
  widescreen: { width: 1920, height: 1080, aspectRatio: 1.777777777777778 },
} as const

let _app: App

export const getMostRecentApp = () => _app
export const baseUrl = 'https://aitmed.com/'
export const assetsUrl = `${baseUrl}assets/`
export const nui = NUI
export const ndom = new NOODLDOM(nui)
export const root = { GeneralInfo: { Radio: [{ key: 'Gender', value: '' }] } }
export const viewport = new Viewport({
  width: deviceSize.iphone6.width,
  height: deviceSize.iphone6.height,
})

const defaultResolversKeys = u.keys(
  defaultResolvers,
) as (keyof typeof defaultResolvers)[]

type MockDrawResolver =
  | Resolve.Config
  | keyof typeof defaultResolvers
  | (Resolve.Config | keyof typeof defaultResolvers)[]

interface MockRenderOptions {
  components?: ComponentObject | ComponentObject[]
  currentPage?: string
  page?: NOODLDOMPage
  pageName?: string
  pageObject?: PageObject
  resolver?: MockDrawResolver
  root?: Record<string, any>
}

/**
 * A helper that tests a noodl-ui-dom DOM resolver. This helps to automatically prepare
 * the noodl-ui client when testing resolvers. The root object automatically
 * inserts the pageName and pageObject if they are both set, so its entirely optional
 * to provide a getRoot function in that case
 */
export function createRender(opts: MockRenderOptions) {
  ndom.reset()

  let currentPage = ''
  let pageRequesting = ''
  let page: NOODLDOMPage | undefined
  let pageObject: Partial<PageObject> | undefined
  let root = { ...NUI.getRoot(), ...opts?.root }

  currentPage = opts.currentPage || ''
  page = opts.page
  pageRequesting = opts.pageName || page?.requesting || 'Hello'
  pageObject =
    (opts.pageObject
      ? ({
          ...opts.pageObject,
          components: opts.components || opts.pageObject.components || [],
        } as PageObject)
      : undefined) ||
    ({ components: opts.components || page?.components || [] } as PageObject)

  !page && (page = ndom.page || ndom.createPage(currentPage))
  !opts.resolver && (opts.resolver = defaultResolversKeys)

  if (page.requesting !== pageRequesting) page.requesting = pageRequesting
  if (page.page !== currentPage) page.page = currentPage

  u.array(opts.resolver).forEach(
    (resolver: Resolve.Config | typeof defaultResolversKeys[number]) => {
      if (u.isStr(resolver)) {
        defaultResolvers[resolver] && ndom.register(defaultResolvers[resolver])
      } else {
        resolver && ndom.register(resolver)
      }
    },
  )

  pageObject = {
    ...root,
    ...root[pageRequesting],
    ...pageObject,
  }

  if (pageObject && !u.isArr(pageObject?.components)) {
    pageObject.components = [pageObject.components as any]
  }

  if (u.isUnd(page.viewport.width) || u.isUnd(page.viewport.height)) {
    page.viewport.width = page.viewport.width || 375
    page.viewport.height = page.viewport.height || 667
  }

  const use = {
    getAssetsUrl: () => assetsUrl,
    getBaseUrl: () => baseUrl,
    getPageObject: async () => pageObject as PageObject,
    getPages: () => [pageRequesting],
    getPreloadPages: () => [],
    getRoot: () => ({
      ...opts.root,
      [pageRequesting]: pageObject,
    }),
  }

  ndom.use({
    transaction: {
      [nuiEmitTransaction.REQUEST_PAGE_OBJECT]: async () =>
        pageObject as PageObject,
    },
  })

  ndom.use(use)

  const o = {
    ...use,
    assetsUrl,
    baseUrl,
    nui: NUI,
    ndom,
    page,
    pageObject,
    request: (pgName?: string) => {
      pgName && page && (page.requesting = pgName)
      return ndom.request(page)
    },
    render: async (pgName?: string): Promise<NUIComponent.Instance> => {
      const req = await o.request(pgName)
      return req && req?.render()[0]
    },
  }

  return o
}

export class MockNoodl extends EventEmitter {
  #root: Record<string, any> = {}
  _isMock: boolean
  aspectRatio = 1
  assetsUrl = assetsUrl
  baseUrl = baseUrl
  cadlBaseUrl = baseUrl
  cadlEndpoint = { page: [], preload: [], startPage: '' }
  emitCall = (arg: any) => Promise.resolve(arg)
  viewWidthHeightRatio?: { min: number; max: number };

  [u.inspect]() {
    return {
      assetsUrl: this.assetsUrl,
      baseUrl: this.baseUrl,
      cadlBaseUrl: this.cadlBaseUrl,
      cadlEndpoint: this.cadlEndpoint,
      root: this.root,
      viewWidthHeightRatio: this.viewWidthHeightRatio,
    }
  }

  constructor({ startPage }: { startPage?: string } = {}) {
    super()
    this._isMock = true
    startPage && (this.cadlEndpoint.startPage = startPage)
  }
  get root() {
    return this.#root
  }
  set root(root) {
    this.#root = root
  }
  async init() {}
  async initPage(
    pageName: string,
    someArr?: string[],
    opts?: { builtIn?: {} },
  ) {}
  editDraft(fn: (draft: Draft<MockNoodl['root']>) => void) {
    fn(this.root)
  }
  getConfig() {
    return {}
  }
  async getStatus() {
    return ({ code: 0 } as any) as () => Promise<
      Status & { userId: string; phone_number: string }
    >
  }
  setFromLocalStorage(key: string) {}
}

// Mock noodl SDK
export const noodl = new MockNoodl() as MockNoodl

export async function initializeApp(
  opts?: Parameters<App['initialize']>[0] & {
    app?: App
    components?: ComponentObject | ComponentObject[]
    noodl?: CADL | MockNoodl
    pageName?: string
    pageObject?: PageObject
    room?: {
      localParticipant?: MockParticipant | LocalParticipant
      state?: string
      participants?: Record<string, any> | Map<string, any>
    }
    root?: Record<string, any>
    transaction?: Partial<Transaction>
  } & {
    builtIn?: Partial<Record<string, Store.BuiltInObject['fn']>>
    emit?: Partial<Record<NUITrigger, Store.ActionObject<'emit'>['fn']>>
    register?: Record<string, Register.Object['fn']>
  } & Partial<
      Record<
        NUIActionGroupedType,
        Store.ActionObject<NUIActionGroupedType>['fn']
      >
    >,
) {
  let _noodl = (opts?.noodl || noodl) as CADL
  let {
    app: appProp,
    components: componentsProp,
    pageName = 'SignIn',
    pageObject,
    root,
    ...rest
  } = opts || {}

  !root && (root = { ..._noodl.root })

  opts?.root && (_noodl.root = { ..._noodl.root, ...opts.root })

  _app =
    appProp ||
    new App({
      getStatus: noodl.getStatus.bind(noodl) as any,
      noodl: _noodl,
      nui,
      ndom,
      viewport,
    })

  pageName && (_app.mainPage.page = pageName)

  if (pageObject) {
    _app.mainPage.components = componentsProp || pageObject.components || []
    _app.mainPage.getNuiPage().object().components = _app.mainPage.components
  }

  _app.meeting.room = getMockRoom({
    localParticipant: (opts?.room?.localParticipant ||
      getMockParticipant()) as LocalParticipant,
    participants: opts?.room?.participants,
    state: opts?.room?.state as MockRoom['state'],
  })

  if (_app.meeting.room.participants.size) {
    for (const participant of _app.meeting.room.participants.values()) {
      _app.meeting.addRemoteParticipant(participant)
    }
  }

  await _app.initialize({
    firebase: { client: { messaging: noop } as any, vapidKey: 'mockVapidKey' },
    firebaseSupported: false,
  })

  // Handle custom provided fns to substitute
  const handleAction = (
    actionType: LiteralUnion<NUIActionGroupedType, string>,
    fn: Store.ActionObject<NUIActionGroupedType>['fn'],
  ) => {
    const obj = _app.actions[actionType as NUIActionGroupedType]?.[0]
    obj && (obj.fn = fn)
  }
  const handleBuiltIn = (funcName: string, fn: Store.BuiltInObject['fn']) => {
    const obj = _app.builtIns.get(funcName)?.[0]
    obj && (obj.fn = fn)
  }
  const handleEmit = (
    trigger: LiteralUnion<NUITrigger, string>,
    fn: Store.ActionObject<'emit'>['fn'],
  ) => {
    const obj = _app.actions.emit.get(trigger as NUITrigger)?.[0]
    obj && (obj.fn = fn)
  }
  const handleRegister = (name: string, fn: Register.Object['fn']) => {
    const obj = _app.actions.register?.[name]?.[0]
    obj && (obj.fn = fn)
  }

  u.entries(opts).forEach(([key, value]) => {
    if (nuiActionTypes.includes(key as NUIActionType)) {
      if (key === 'builtIn') {
        u.entries(value).forEach((args) => handleBuiltIn(...args))
      } else if (key === 'emit') {
        u.entries(value).forEach((args) => handleEmit(...args))
      } else if (key === 'register') {
        u.entries(value).forEach((args) => handleRegister(...args))
      } else {
        u.entries(value).forEach((args) => handleAction(...args))
      }
    } else if (key === 'room') {
      if (value?.participants) {
        if (value.participants instanceof Map) {
          for (const [sid, participant] of value.participants) {
            _app.meeting.room.participants.set(sid, participant)
          }
        } else {
          u.entries(value.participants).forEach(([sid, participant]) => {
            _app.meeting.room.participants.set(sid, participant)
          })
        }
        _app.updateRoot(
          c.PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT,
          Array.from(_app.meeting.room.participants.values()),
        )
      }
    } else if (key === 'root') {
      !_app.noodl.root && (_app.noodl.root = {})
      _app.updateRoot(
        (draft) => void u.assign(draft, { [pageName]: pageObject }),
      )
    }
    u.assign(_app.noodl.root, { [pageName]: pageObject })
  })

  if (
    _app.meeting.room.state === 'connected' &&
    _app.mainPage.page === 'VideoChat'
  ) {
    _app.meeting.onConnected(_app.meeting.room)
  }

  const _test = {
    addParticipant(participant: any) {
      const room = _app.meeting.room
      !(room.participants instanceof Map) && (room.participants = new Map())
      !participant.sid && (participant.sid = u.getRandomKey())
      room.participants.set(participant.sid, participant)
      // TODO - the emit call here is actually not emitting the event
      room.emit('participantConnected', participant)
      _app.meeting.addRemoteParticipant(participant)
    },
    clear() {
      _app.streams.reset()
      // _app.meeting.reset()
    },
    getComponent(id: string) {
      for (const component of _app.cache.component) {
        if (component?.id === id) return component
      }
      return {} as NUIComponent.Instance
    },
    triggerAction({
      action,
      args,
      component,
      page,
      trigger,
    }: {
      action: NUIActionObjectInput
      args?: any
      component: NUIComponent.Instance | undefined
      page?: NUIPage
      trigger?: NUITrigger
    }) {
      !page && (page = _app.mainPage.getNuiPage())
      !trigger && (trigger = 'onClick')
      return _app.nui
        .createActionChain(trigger, [action], {
          component,
          page,
          loadQueue: true,
        })
        .queue[0].execute(args)
    },
  }

  Object.defineProperty(_app, '_test', { value: _test })

  _test.clear()

  return _app as App & { _test: typeof _test }
}

export async function getApp(
  args: Partial<Parameters<typeof initializeApp>[0]> & {
    navigate?: boolean
    preset?: 'meeting'
  } = {},
) {
  const { navigate, preset, room } = args

  const _args = { pageName: 'SignIn', ...args } as typeof args

  // _args.pageObject = {
  //   ..._args.root?.[_args.pageName as string],
  //   ...pageObjectProp,
  //   components:
  //     components ||
  //     pageObjectProp?.components ||
  //     _args.root?.[_args.pageName as string] ||
  //     [],
  // }

  if (preset === 'meeting') {
    let components = _args.pageObject?.components
    const pageObject = getVideoChatPage({ participants: [] })
    pageObject.components = components || pageObject.components || []
    u.assign(_args, {
      pageName: 'VideoChat',
      pageObject,
      room: { state: 'connected', ...room },
    })
  }

  const app = await initializeApp(args)

  navigate && (await app.navigate(_args.pageName as string))
  return app
}

export function getActions(app: any = {}) {
  return createActions(app)
}

export function getBuiltIns<FuncName extends string = string>(
  app: FuncName | FuncName[] | App | {},
) {
  if (u.isStr(app) || u.isArr(app)) {
    const _fns = createBuiltIns({} as any)
    const funcNames = u.array(app)
    return u.entries(_fns).reduce((acc, [funcName, fn]) => {
      if (funcNames.includes(funcName as FuncName)) {
        acc[funcName as FuncName] = fn
      }
      return acc
    }, {} as Record<FuncName, Store.BuiltInObject['fn']>)
  }
  return createBuiltIns(app || ({} as any))
}
