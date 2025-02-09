// @ts-nocheck
import fs from 'fs'
import path from 'path'
import type { LiteralUnion } from 'type-fest'
import type { Status } from '@aitmed/ecos-lvl2-sdk'
import type { LocalParticipant } from 'twilio-video'
import type { ComponentObject, PageObject } from 'noodl-types'
import { EventEmitter } from 'events'
import {
  actionTypes as nuiActionTypes,
  nuiEmitTransaction,
  NDOM,
  NDOMPage,
  NUI,
  NUIActionType,
  NuiComponent,
  NUITrigger,
  NUIActionGroupedType,
  NUIActionObjectInput,
  Page as NUIPage,
  Register,
  Resolve,
  Store,
  Viewport,
} from 'noodl-ui'
import * as u from '@jsmanifest/utils'
import App from '../App'
import getMockRoom, { MockRoom } from './helpers/getMockRoom'
import getVideoChatPage from './helpers/getVideoChatPage'
import getMockParticipant, {
  MockParticipant,
} from './helpers/getMockParticipant'
import * as c from '../constants'
import { getRandomKey } from '../utils/common'

export const deviceSize = {
  galaxys5: { width: 360, height: 640, aspectRatio: 0.5621345029239766 },
  iphone6: { width: 375, height: 667, aspectRatio: 0.562545720555962 },
  ipad: { width: 768, height: 1024, aspectRatio: 0.7495126705653021 },
  widescreen: { width: 1920, height: 1080, aspectRatio: 1.777777777777778 },
} as const

let _app: App

export const getMostRecentApp = () => _app
export const baseUrl = 'http://127.0.0.1:3000/'
export const assetsUrl = `${baseUrl}assets/`
export const nui = NUI
export const ndom = new NDOM()
export const root = { GeneralInfo: { Radio: [{ key: 'Gender', value: '' }] } }
export const viewport = new Viewport({
  width: deviceSize.iphone6.width,
  height: deviceSize.iphone6.height,
})

type MockDrawResolver = Resolve.Config | Resolve.Config[]

interface MockRenderOptions {
  components?: ComponentObject | ComponentObject[]
  currentPage?: string
  page?: NDOMPage
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
  let page: NDOMPage | undefined
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

  if (page.requesting !== pageRequesting) page.requesting = pageRequesting
  if (page.page !== currentPage) page.page = currentPage

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
      // @ts-ignore
      [nuiEmitTransaction.REQUEST_PAGE_OBJECT]: async () => pageObject,
    },
  })

  // @ts-ignore
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
    render: async (pgName?: string): Promise<NuiComponent.Instance> => {
      const req = await o.request(pgName)
      // @ts-expect-error
      return req && (req?.render()[0] as NuiComponent.Instance)
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

  [Symbol.for('nodejs.util.inspect.custom')]() {
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
  reset() {
    this.#root = {}
    this.aspectRatio = 1
    this.assetsUrl = assetsUrl
    this.baseUrl = baseUrl
    this.cadlBaseUrl = baseUrl
    this.cadlEndpoint = { page: [], preload: [], startPage: '' }
    this.emitCall = (arg: any) => Promise.resolve(arg)
    this.viewWidthHeightRatio = undefined
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
  editDraft(fn: (draft: MockNoodl['root']) => void) {
    fn(this.root)
  }
  getConfig() {
    return {}
  }
  async getStatus() {
    return { code: 0 } as any as () => Promise<
      Status & { userId: string; phone_number: string }
    >
  }
  setFromLocalStorage(key: string) {}
}

// Mock noodl SDK
export const noodl = new MockNoodl() as MockNoodl

export async function initializeApp(
  opts?: {
    app?: App
    components?: ComponentObject | ComponentObject[]
    pageName?: string
    pageObject?: PageObject
    room?: {
      localParticipant?: MockParticipant | LocalParticipant
      state?: string
      participants?: Record<string, any> | Map<string, any>
    }
    root?: Record<string, any>
    transaction?: any
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
  let {
    components: componentsProp,
    pageName,
    pageObject,
    room,
    root,
    ...rest
  } = opts || {}

  const appOpts = {} as NonNullable<
    ConstructorParameters<NonNullable<typeof App>>[0]
  >
  appOpts.getStatus = noodl.getStatus.bind(noodl) as any
  appOpts.noodl = noodl as any
  appOpts.ndom = ndom
  appOpts.nui = nui
  appOpts.viewport = viewport

  if (root) u.assign(noodl.root, root)
  if (!pageName) pageName = 'SignIn'
  if (!pageObject) {
    pageObject = {
      components:
        (componentsProp as any) || noodl.root[pageName]?.components || [],
    }
  }

  _app = new App(appOpts)

  _app.updateRoot((draft) => {
    draft[pageName as string] = {
      ...noodl.root[pageName as string],
      ...pageObject,
    }
  })

  _app.mainPage.requesting = pageName

  _app.meeting.room = getMockRoom({
    localParticipant: (room?.localParticipant ||
      getMockParticipant()) as LocalParticipant,
    participants: room?.participants,
    state: room?.state as MockRoom['state'],
  })

  if (_app.meeting.room.participants.size) {
    for (const participant of _app.meeting.room.participants.values()) {
      _app.meeting.addRemoteParticipant(participant)
    }
  }

  await _app.initialize()

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

  u.entries(opts || {}).forEach(([key, value]) => {
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
      _app.updateRoot(
        (draft) =>
          void u.assign(draft, { [_app.mainPage.requesting]: pageObject }),
      )
    }
    _app.updateRoot(
      (draft) => void (draft[_app.mainPage.requesting] = pageObject),
    )
  })

  _app.meeting.room.state === 'connected' &&
    _app.mainPage.page === 'VideoChat' &&
    _app.meeting.onConnected(_app.meeting.room)

  const _test = {
    addParticipant(participant: any) {
      const room = _app.meeting.room
      !(room.participants instanceof Map) && (room.participants = new Map())
      !participant.sid && (participant.sid = getRandomKey())
      room.participants.set(participant.sid, participant)
      // TODO - the emit call here is actually not emitting the event
      room.emit('participantConnected', participant)
      _app.meeting.addRemoteParticipant(participant)
    },
    clear() {
      _app.streams.reset()
    },
    getComponent(id: string) {
      for (const component of _app.cache.component) {
        if (component?.component.id === id) return component
      }
      return {} as NuiComponent.Instance
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
      component: NuiComponent.Instance | undefined
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
  },
) {
  const { navigate, preset, room } = args

  const _args = { pageName: 'SignIn', ...args }

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

export function loadFixture(...p: string[]) {
  const basePath = path.join(__dirname, 'fixtures')
  if (p[p.length - 1].endsWith('.json')) {
    const content = fs.readFileSync(path.join(basePath, ...p))
    return JSON.parse(content)
  }
  return fs.readFileSync(path.join(basePath, ...p))
}
