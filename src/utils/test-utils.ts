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
  NOODLUI as NUI,
  NUIComponent,
  Viewport,
  Store,
} from 'noodl-ui'
import App from '../App'
import createActions from '../handlers/actions'
import createBuiltIns from '../handlers/builtIns'
import * as u from './common'

export const deviceSize = {
  galaxys5: { width: 360, height: 640, aspectRatio: 0.5621345029239766 },
  iphone6: { width: 375, height: 667, aspectRatio: 0.562545720555962 },
  ipad: { width: 768, height: 1024, aspectRatio: 0.7495126705653021 },
  widescreen: { width: 1920, height: 1080, aspectRatio: 1.777777777777778 },
} as const

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
    render: async (pgName?: string) => {
      const req = await o.request(pgName)
      return req && (req?.render()[0] as NUIComponent.Instance)
    },
  }

  return o
}

export class MockNoodl {
  aspectRatio = 1
  assetsUrl = assetsUrl
  baseUrl = baseUrl
  cadlBaseUrl = baseUrl
  cadlEndpoint = { page: [], preload: [], startPage: '' }
  emitCall = (arg: any) => Promise.resolve(arg)
  root = root
  viewWidthHeightRatio?: { min: number; max: number }
  constructor({ startPage }: { startPage?: string } = {}) {
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
    noodl?: CADL | MockNoodl
    transaction?: Partial<Transaction>
  },
) {
  const meeting = {
    getStreams: () =>
      ({
        getMainStream: noop,
        getSelfStream: noop,
        getSubStreamsContainer: noop,
        getSubstreamsCollection: noop,
        createSubStreamsContainer: noop,
      } as any),
    initialize: noop as any,
    join: noop as any,
    leave: noop as any,
    room: noop as any,
  } as any

  const app =
    opts?.app ||
    new App({
      getStatus: noodl.getStatus.bind(noodl) as any,
      meeting,
      noodl: (opts?.noodl || noodl || new MockNoodl()) as CADL,
      nui,
      ndom,
      viewport,
    })

  // const actions = createActions(app)
  // const builtIns = createBuiltIns(app)
  // const registers = createRegisters(app)
  // const domResolvers = createExtendedDOMResolvers(app)
  // const meetingFns = createMeetingFns(app)

  await app.initialize({
    firebase: { client: { messaging: noop } as any, vapidKey: '' },
    firebaseSupported: false,
  })

  return app as App
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
