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
  nuiEmitTransaction,
  NUI,
  NUIActionType,
  NUIComponent,
  Viewport,
  Store,
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
    transaction?: Partial<Transaction>
    // use?: typeof NUI.use
  } & Partial<Record<NUIActionType, Store.ActionObject | Store.BuiltInObject>>,
) {
  let _noodl = (opts?.noodl || noodl) as CADL

  _app =
    opts?.app ||
    new App({
      getStatus: noodl.getStatus.bind(noodl) as any,
      noodl: _noodl,
      nui,
      ndom,
      viewport,
    })

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

  let pageName = opts?.pageName || ''

  u.entries(opts).forEach(([key, value]) => {
    if (nuiActionTypes.includes(key as NUIActionType)) {
      if (key === 'builtIn') {
        _app.nui.use({ builtIn: value })
      } else if (key === 'emit') {
        _app.nui.use({ emit: value })
      } else {
        _app.nui.use({ [key]: value })
      }
    } else if (key === 'pageName') {
      pageName = value
      _app.mainPage.page = pageName
    } else if (key === 'pageObject') {
      _app.mainPage.components = opts?.components || value.components || []
      _app.mainPage.getNuiPage().object().components = _app.mainPage.components
    }
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

  const _args = {
    pageName: 'SignIn',
    pageObject: { components: [] },
    ...args,
  } as typeof args

  if (preset === 'meeting') {
    const pageObject = getVideoChatPage({ participants: [] })
    u.assign(_args, {
      pageName: 'VideoChat',
      pageObject,
      room: { state: 'connected', ...room },
    })
  }

  const app = await initializeApp(_args)
  u.assign(app.noodl.root, { [_args.pageName as string]: _args.pageObject })

  if (room?.participants) {
    if (room.participants instanceof Map) {
      for (const [sid, participant] of room.participants) {
        app.meeting.room.participants.set(sid, participant)
      }
    } else {
      u.entries(room.participants).forEach(([sid, participant]) => {
        app.meeting.room.participants.set(sid, participant)
      })
    }
    app.updateRoot(
      c.PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT,
      Array.from(app.meeting.room.participants.values()),
    )
  }

  navigate && (await app.navigate(_args.pageName as string))
  return app
}

export function getActions(app: any = {}) {
  return createActions(app)
}

export function getBuiltIns<FuncName extends string = string>(
  funcNames: FuncName | FuncName[],
): Record<FuncName, Store.BuiltInObject>
export function getBuiltIns(app?: any): Store.BuiltInObject[]
export function getBuiltIns<FuncName extends string = string>(
  app: FuncName | FuncName[] | App | {},
) {
  if (u.isStr(app) || u.isArr(app)) {
    const _fns = createBuiltIns({} as any)
    const _fnNames = u.array(app)
    return _fns.reduce((acc, obj) => {
      if (_fnNames.includes(obj.funcName as FuncName)) {
        acc[obj.funcName as FuncName] = obj
      }
      return acc
    }, {} as Record<FuncName, Store.BuiltInObject>)
  }
  return createBuiltIns(app || ({} as any))
}
