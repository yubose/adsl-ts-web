import { EventEmitter } from 'events'
import { Status } from '@aitmed/ecos-lvl2-sdk'
import CADL from '@aitmed/cadl'
import noop from 'lodash/noop'
import { Draft } from 'immer'
import { ComponentObject, PageObject } from 'noodl-types'
import NOODLDOM, {
  defaultResolvers,
  Page as NOODLDOMPage,
  Resolve,
  Transaction,
} from 'noodl-ui-dom'
import {
  nuiEmitTransaction,
  NUI,
  NUIComponent,
  Viewport,
  Store,
} from 'noodl-ui'
import App from '../App'
import createActions from '../handlers/actions'
import createBuiltIns from '../handlers/builtIns'
import getMockRoom from '../__tests__/helpers/getMockRoom'
import getMockParticipant from '../__tests__/helpers/getMockParticipant'
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
  aspectRatio = 1
  assetsUrl = assetsUrl
  baseUrl = baseUrl
  cadlBaseUrl = baseUrl
  cadlEndpoint = { page: [], preload: [], startPage: '' }
  emitCall = (arg: any) => Promise.resolve(arg)
  root = root
  viewWidthHeightRatio?: { min: number; max: number }
  constructor({ startPage }: { startPage?: string } = {}) {
    super()
    startPage && (this.cadlEndpoint.startPage = startPage)
  }
  async init() {}
  async initPage(
    pageName: string,
    someArr?: string[],
    opts?: { builtIn?: {} },
  ) {}
  editDraft(fn: (draft: Draft<typeof root>) => void) {
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
      state?: string
      participants?: Record<string, any> | Map<string, any>
    }
    transaction?: Partial<Transaction>
  },
) {
  _app =
    opts?.app ||
    new App({
      getStatus: noodl.getStatus.bind(noodl) as any,
      // meeting: createMeetingFns,
      noodl: (opts?.noodl || noodl || new MockNoodl()) as CADL,
      nui,
      ndom,
      viewport,
    })

  await _app.initialize({
    firebase: { client: { messaging: noop } as any, vapidKey: 'mockVapidKey' },
    firebaseSupported: false,
  })

  if (opts?.pageObject) {
    opts.pageName && (_app.mainPage.page = opts.pageName)
    _app.mainPage.components = (opts.components ||
      opts.pageObject.components ||
      []) as ComponentObject[]
    _app.mainPage.getNuiPage().object().components = _app.mainPage.components
  }

  const _test = {
    addParticipant(participant: any) {
      if (!(_app.meeting.room.participants instanceof Map)) {
        _app.meeting.room.participants = new Map()
      }
      participant.sid = participant.sid || u.getRandomKey()
      _app.meeting.room.participants.set(participant.sid, participant)
      // TODO - the emit call here is actually not emitting the event
      _app.meeting.room.emit('participantConnected', participant)
      _app.meeting.addRemoteParticipant(participant)
    },
    clear() {
      _app.streams.mainStream.reset()
      _app.streams.selfStream.reset()
      _app.streams.subStreams?.reset()
      _app.meeting.reset()
    },
  }

  Object.defineProperty(_app, '_test', { value: _test })

  if (opts?.room) {
    let room = getMockRoom(opts.room)
    _app.meeting.join = async () => room
    Object.defineProperty(_app.meeting, 'room', {
      configurable: true,
      enumerable: true,
      get() {
        return room
      },
      set(_room) {
        room = _room
      },
    })

    // room.state && (_app.meeting.room.state = room.state)
    if (room.participants) {
      if (room.participants instanceof Map) {
        _app.meeting.room.participants = room.participants
        if (_app.meeting.room.participants.size) {
          for (const participant of _app.meeting.room.participants.values()) {
            _app.meeting.room.participants.set(participant.sid, participant)
            _app.meeting.addRemoteParticipant(participant)
          }
        }
      } else {
        _app.meeting.room.participants = new Map()
        u.entries(room.participants).forEach(([sid, participant]) => {
          _app.meeting.room?.participants?.set(sid, participant)
          _app.meeting.addRemoteParticipant(participant)
        })
      }
    }
  }

  _app.meeting.streams.mainStream.reset()
  _app.meeting.streams.selfStream.reset()
  _app.meeting.streams.subStreams?.reset()

  return _app as App & { _test: typeof _test }
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
