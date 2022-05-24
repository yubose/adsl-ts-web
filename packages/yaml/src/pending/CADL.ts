// TODO
// @ts-nocheck
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import clone from 'lodash/clone'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import set from 'lodash/set'
import produce, { Draft, setAutoFreeze } from 'immer'
import { isBrowser } from '../utils/common'
setAutoFreeze(false)
import store from '../common/store'
import { PopulateError, UnableToExecuteFn, UnableToLoadConfig } from '../errors'
import {
  createFuncAttacher,
  populateObject,
  populateKeys,
  populateVals,
  populateArray,
  replaceEvalObject,
  replaceVars,
} from './utils'
import hasAbortPopup from '../utils/hasAbortPopup'
import getDispatcher from '../dispatcher'
import getEmitter from '../emit'
import fetchNoodlObject from '../utils/fetchNoodlObject'
import log from '../utils/log'
import isNoodlFunction from '../utils/isNoodlFunction'
import isPopulated from '../utils/isPopulated'
import mergeDeep from '../utils/mergeDeep'
import populateString from '../utils/populateString'
import builtInFns from './services/builtIn'
import IndexRepository from '../db/IndexRepository'
import cache from '../cache'
import ActiveQueue from '../ActiveQueue'
import { _TEST_ } from '../utils/common'
import * as c from '../constants'
import * as t from '../types'

class CADL {
  #aspectRatio = 1
  #designSuffix = {} as Record<string, any>
  #config: nt.RootConfig | null = null
  #cadlBaseUrl: string | undefined
  #baseUrl = ''
  #assetsUrl = ''
  #dispatch: ReturnType<typeof getDispatcher>
  #emit: ReturnType<typeof getEmitter>
  #root: t.Root
  #state = {
    init: {
      initiating: false,
      done: false,
      error: null,
    },
  } as t.State

  #subscribers = {
    queue: [],
  } as t.ActiveQueueSubscribers

  #dbConfig: any
  #indexRepository: IndexRepository
  #queue: ActiveQueue

  cadlEndpoint: nt.AppConfig | null = null
  cadlVersion: nt.Env
  initCallQueue = [] as any[]
  myBaseUrl = ''
  verificationRequest = {
    timer: 0,
    phoneNumber: '',
  };

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      assetsUrl: this.assetsUrl,
      cadlBaseUrl: this.cadlBaseUrl,
      cadlEndpoint: this.cadlEndpoint,
      cadlVersion: this.cadlVersion,
      myBaseUrl: this.myBaseUrl,
      state: this.getState(),
    }
  }

  constructor({
    configUrl,
    cadlVersion,
    aspectRatio,
    dbConfig,
    loglevel,
    SearchClient,
  }: {
    configUrl: string
    cadlVersion: nt.Env
    aspectRatio?: number
    loglevel?: keyof typeof log.levels
    dbConfig?: any
    SearchClient?: InstanceType<any> // See the interac
  }) {
    store.env = cadlVersion
    store.configUrl = configUrl
    store.noodlInstance = this
    if (loglevel) log.setLevel(loglevel)
    this.cadlVersion = cadlVersion
    if (aspectRatio) this.aspectRatio = aspectRatio
    this.#dbConfig = dbConfig
    this.#indexRepository = new IndexRepository()
    this.#dispatch = getDispatcher(this)
    this.#emit = getEmitter<t.Root>(
      (callback) => (this.root = callback(this.root)),
    )
    this.#root = produce({} as t.Root, (draft) => {
      draft.actions = {}
      // draft.builtIn = builtInFns(this.dispatch.bind(this))
      draft.builtIn = builtInFns({
        dispatch: this.dispatch.bind(this),
        processPopulate: this.processPopulate.bind(this),
        getPage: this.getPage.bind(this),
        emit: this.emit.bind(this),
        SearchClient,
      })
      draft.apiCache = {} as t.Root['apiCache']
    }) as t.Root
    this.#queue = new ActiveQueue()
  }

  get dispatch() {
    return this.#dispatch
  }

  get emit() {
    return this.#emit
  }

  get indexRepository() {
    return this.#indexRepository
  }

  /**
   * Loads noodl config if not already loaded
   * Sets CADL version, baseUrl, assetsUrl, and root
   */
  async init({
    onFetchPreload,
    use,
  }: {
    onFetchPreload?: (
      name: string,
      config: nt.RootConfig,
      cadlEndpoint: nt.AppConfig,
    ) => void
    use?: {
      BaseDataModel?: Record<string, any>
      BaseCSS?: Record<string, any>
      BasePage?: Record<string, any>
      config?: nt.RootConfig
      cadlEndpoint?: nt.AppConfig
    } & { [pageName: string]: Record<string, any> }
  } = {}): Promise<void> {
    let config: nt.RootConfig

    try {
      config = (use?.config ||
        (await store.level2SDK.loadConfigData())) as nt.RootConfig
    } catch (error) {
      throw new UnableToLoadConfig(
        'An error occured while trying to load the config',
        error instanceof Error ? error : new Error(String(error)),
      )
    }

    // Initialize sqlite db
    await this.#indexRepository.getDataBase(this.#dbConfig)

    //get app curent position

    if (isBrowser() && config?.isGetPosition) {
      const opt = {
        enableHighAccuracy: true,
        timeout: 3000,
        maximumAge: 60 * 1000,
      }
      window.navigator.geolocation.getCurrentPosition(
        (position) => {
          const longitude = position.coords.longitude
          const latitude = position.coords.latitude
          store.currentLatitude = latitude
          store.currentLongitude = longitude
          localStorage.setItem('longitude', JSON.stringify(longitude))
          localStorage.setItem('latitude', JSON.stringify(latitude))
        },
        (error) => {
          let msg = ''
          switch (error.code) {
            case error.PERMISSION_DENIED:
              msg = 'User rejects request to get geolocation.'
              break
            case error.POSITION_UNAVAILABLE:
              msg = 'Location information is not available.'
              break
            case error.TIMEOUT:
              msg = 'Requesting user geolocation timed out.'
              break
            default:
              msg = `Error: ${error.message || 'unknown error'}`
            // case error.UNKNOWN_ERROR:
            //     msg = "unknown error"
            //     break;
          }
          log.error(msg)
        },
        opt,
      )
    }

    const {
      web = { cadlVersion: '' },
      cadlBaseUrl = '',
      cadlMain = '',
      designSuffix = '',
      myBaseUrl = '',
    } = config

    this.cadlVersion = (web.cadlVersion as any)[this.cadlVersion]
    this.#designSuffix = designSuffix
    this.cadlBaseUrl = cadlBaseUrl
    this.myBaseUrl = myBaseUrl

    let cadlEndpointUrl = `${this.cadlBaseUrl}${cadlMain}`

    this.cadlEndpoint =
      use?.cadlEndpoint ||
      (await fetchNoodlObject<nt.AppConfig>(cadlEndpointUrl))[0]

    const { baseUrl = '', assetsUrl = '', preload } = this.cadlEndpoint || {}

    this.baseUrl = baseUrl
    this.assetsUrl = assetsUrl
    this.#config = this.processPopulate({
      source: config,
      lookFor: ['.', '..', '=', '~'],
    }) as nt.RootConfig

    this.emit({
      type: c.emitType.SET_ROOT_PROPERTIES,
      payload: { properties: { Config: this.#config } },
    })

    const preloads = (preload || []) as string[]

    for (const name of preloads) {
      let source = use?.[name]
      if (!source) {
        onFetchPreload?.(name, this.#config, this.cadlEndpoint)
        source = (await this.getPage(name))?.[0]
      }
      this.emit({
        type: c.emitType.SET_ROOT_PROPERTIES,
        payload: {
          properties: this.processPopulate({
            source,
            lookFor: ['.', '..', '=', '~'],
          }),
        },
      })
    }

    // set Global object from localStorage
    // used to retain user data in case of browser reload
    let cachedGlobal = isBrowser() && localStorage.getItem('Global')
    let cachedGlobalParsed: Record<string, any> | null = null

    if (cachedGlobal) {
      try {
        cachedGlobalParsed = JSON.parse(cachedGlobal)
      } catch (error) {
        log.error(error instanceof Error ? error : new Error(String(error)))
      }
      if (cachedGlobalParsed) {
        this.emit({
          type: c.emitType.SET_ROOT_PROPERTIES,
          payload: {
            properties: {
              Global: {
                ...cachedGlobalParsed,
                globalRegister: this.root.Global?.globalRegister,
              },
            },
          },
        })

        const currentUser = cachedGlobalParsed?.currentUser
        const userVertex = currentUser?.vertex
        const ls = u.isBrowser() ? window.localStorage : null

        if (ls) {
          if (!ls.getItem('jwt') && currentUser.JWT) {
            ls.setItem('jwt', currentUser.JWT)
          }

          if (!ls.getItem('pk') && userVertex.pk) {
            ls.setItem('pk', userVertex.pk)
          }

          if (!ls.getItem('sk') && userVertex.sk) {
            ls.setItem('sk', userVertex.sk)
          }

          if (!ls.getItem('user_vid') && userVertex.id) {
            ls.setItem('user_vid', userVertex.id)
          }
        }

        await this.dispatch({
          type: c.dispatchActionType.UPDATE_DATA,
          //TODO: handle case for data is an array or an object
          payload: {
            pageName: 'builtIn',
            dataKey: 'builtIn.UserVertex',
            data: userVertex,
          },
        })
      }
    }
  }

  /**
   *
   * @param pageName
   * @param skip Denotes the keys to skip in the population process
   * @param options Object that takes in set of options for the page
   *
   * @throws {UnableToRetrieveYAML} -When unable to retrieve noodlYAML
   * @throws {UnableToParseYAML} -When unable to parse yaml file
   * @throws {UnableToExecuteFn} -When something goes wrong while executing any init function
   *
   * - initiates cadlObject for page specified
   */
  async initPage(
    pageArg:
      | string
      | {
          pageName: string
          cadlYAML: string
          cadlObject: Record<string, nt.PageObject>
        },
    skip: string[] = [],
    options: Pick<
      Parameters<CADL['runInit']>[0],
      'onAfterInit' | 'onBeforeInit' | 'onInit'
    > & {
      reload?: boolean //if true then the pageObject is replaced
      builtIn?: Record<string, any>
      onReceive?(obj: { [pageName: string]: any }): Promise<void> | void
      onAbort?(obj: { [pageName: string]: any }): Promise<void> | void
      onFirstProcess?(obj: { [pageName: string]: any }): Promise<void> | void
      onSecondProcess?(obj: { [pageName: string]: any }): Promise<void> | void
      onFetchPage?: (
        pageName: string,
        config: nt.RootConfig,
        cadlEndpoint: nt.AppConfig,
      ) => void
      shouldAttachRef?: t.ShouldAttachRefFn
      wrapEvalObjects?: boolean
    } = {},
  ): Promise<{ aborted: true } | void> {
    if (!this.cadlEndpoint) await this.init()

    const { builtIn, reload, wrapEvalObjects = true } = options
    u.isNil(reload) && (options.reload = true)

    if (builtIn && u.isObj(builtIn)) {
      this.emit({
        type: c.emitType.ADD_BUILTIN_FNS,
        payload: { builtInFns: { ...builtIn } },
      })
    }

    const cachePageIfNonExistent = (
      page: string,
      pageObject: Record<string, any>,
    ) => {
      if (pageObject && !cache.pages[page]) {
        cache.pages[page] = cloneDeep(pageObject[page] || pageObject)
      }
    }

    let pageName = ''
    let pageCADL: Record<string, nt.PageObject> | undefined

    if (u.isStr(pageArg)) {
      pageName = pageArg
    } else if (pageArg?.pageName) {
      cachePageIfNonExistent(
        (pageName = pageArg.pageName),
        (pageCADL = pageArg.cadlObject),
      )
    }

    if (reload === false && this.root[pageName]) {
      // Keep the current pageObject
      return
    } else {
      if (!pageCADL) {
        if (cache.pages[pageName]) {
          pageCADL = cloneDeep({ [pageName]: cache.pages[pageName] })
        } else {
          options?.onFetchPage?.(
            pageName,
            this.#config as nt.RootConfig,
            this.cadlEndpoint as nt.AppConfig,
          )
          cachePageIfNonExistent(
            pageName,
            (pageCADL = (await this.getPage(pageName))[0]),
          )
        }
      }
      options?.onReceive && (await options?.onReceive?.(pageCADL as any))
    }

    if (this.root[pageName] && reload) {
      this.emit({ type: 'DELETE_PAGE', payload: { pageName } })
    }

    // The pageObject requires multiple processes
    // in order to dereference references that are dependent on other references
    /**
     * e.g =..pageName.object.edge.refid ---> =..pageName.object2.edge.id
     * here the reference "=..pageName.object.edge.refid" references
     * another reference "=..pageName.object2.edge.id"
     * to avoid this we process the object multiple times to make sure that
     * all references that exist are accounted for
     */

    let obj = pageCADL

    obj = this.processPopulate({
      source: obj,
      lookFor: ['.', '..', '~'],
      skip: ['update', 'save', 'check', 'init', 'components', ...skip],
      withFns: true,
      pageName,
      shouldAttachRef: options?.shouldAttachRef,
      wrapEvalObjects,
    }) as Record<string, nt.PageObject>

    options?.onFirstProcess && (await options.onFirstProcess?.(obj))

    obj = this.processPopulate({
      source: obj,
      lookFor: ['.', '..', '_', '~'],
      skip: ['update', 'check', 'init', 'formData', 'components', ...skip],
      shouldAttachRef: options?.shouldAttachRef,
      withFns: true,
      pageName,
      wrapEvalObjects,
    }) as Record<string, nt.PageObject>

    options?.onSecondProcess && (await options.onSecondProcess?.(obj))

    this.emit({
      type: c.emitType.SET_ROOT_PROPERTIES,
      payload: { properties: obj },
    })

    let aborted = false
    let init = u.values(obj)[0]?.init

    const transformPage = async (
      obj: Record<string, nt.PageObject>,
      optsList?: Record<string, any>[],
      pageName = '',
      shouldAttachRef?: t.ShouldAttachRefFn,
    ) => {
      try {
        let currIndex = 0
        let skip = [
          'update',
          'check',
          'init',
          'formData',
          'dataIn',
          'style',
          'message',
        ] as string[]

        if (init) {
        } else {
          skip.push('style')
        }

        while (currIndex <= 1) {
          if (currIndex < 2) {
            skip.push('backgroundColor')
          } else {
            if (skip.includes('backgroundColor')) {
              skip.splice(skip.indexOf('backgroundColor'), 1)
            }
          }

          if (currIndex >= 1) {
            for (const kind of ['edge', 'document', 'vertex']) {
              if (!skip.includes(kind)) skip.push(kind)
            }
          }

          if (currIndex > 1) {
            if (init?.includes('style')) {
              init.splice(init.indexOf('style'), 1)
            }
          }

          obj = this.processPopulate({
            source: obj,
            lookFor: ['.', '..', '_', '~'],
            withFns: true,
            pageName,
            shouldAttachRef,
            ...optsList?.[currIndex],
            skip: [...skip, ...(optsList?.[currIndex]?.skip || [])],
            wrapEvalObjects: true,
          })
          currIndex++
        }

        if (!_TEST_ && !(pageName in obj)) {
          if (cache[pageName]) {
            obj[pageName] = cloneDeep(cache[pageName])
          } else {
            obj[pageName] = {} as any
            log.warn(
              `%c"${pageName}" does not exist in the root or cache. An empty object was created instead`,
              `color:#ec0000;`,
              obj,
            )
          }
        }

        const components =
          populateArray({
            source: obj[pageName]?.components || [],
            lookFor: '=',
            pageName,
            locations: [obj[pageName], this.root],
            shouldAttachRef,
            ...optsList?.[currIndex],
            skip: [
              'update',
              'check',
              'edge',
              'document',
              'vertex',
              'init',
              'formData',
              'dataIn',
              'style',
              ...(optsList?.[currIndex]?.skip || []),
            ],
          }) || []

        set(obj, [pageName, 'components'], components)

        if (wrapEvalObjects) {
          obj = await replaceEvalObject({
            pageName,
            cadlObject: obj,
            dispatch: this.dispatch.bind(this),
            ...optsList?.[++currIndex],
          })
        }
      } catch (error) {
        log.error(error)
      }
      return obj
    }

    if (init) {
      const page: Record<string, nt.PageObject> | { abort: boolean } =
        await this.runInit({
          pageObject: obj,
          onBeforeInit: options?.onBeforeInit,
          onInit: options?.onInit,
          onAfterInit: options?.onAfterInit,
        })

      if ('abort' in page) {
        if (page.abort) {
          aborted = true
          pageCADL && options?.onAbort && (await options?.onAbort?.(pageCADL))
        }
      }

      if (!aborted) {
        const consumerSkipKeys = skip || []
        this.emit({
          type: c.emitType.SET_ROOT_PROPERTIES,
          payload: {
            properties: await transformPage(
              page as Record<string, nt.PageObject>,
              consumerSkipKeys.map((key) => ({ skip: [key] })),
              pageName,
              options?.shouldAttachRef,
            ),
          },
        })
      }
    } else {
      const consumerSkipKeys = skip || []
      this.emit({
        type: c.emitType.SET_ROOT_PROPERTIES,
        payload: {
          properties: await transformPage(
            obj as Record<string, nt.PageObject>,
            [
              { skip: ['ecosObj', 'style', ...consumerSkipKeys] },
              { skip: ['ecosObj', 'style', ...consumerSkipKeys] },
              { skip: ['ecosObj', 'style', ...consumerSkipKeys] },
            ],
            pageName,
            options?.shouldAttachRef,
          ),
        },
      })
    }

    if (aborted) return { aborted }
  }

  /**
   * @param pageName
   * @returns { object }
   * @throws {UnableToRetrieveYAML} -When unable to retrieve cadlYAML
   * @throws {UnableToParseYAML} -When unable to parse yaml file
   */
  async getPage(
    pageName: string,
  ): Promise<[Record<string, nt.PageObject>, string]> {
    //TODO: used for local testing
    // if (pageName === 'AddDocuments') return cloneDeep(AddDocuments)
    // if (pageName === 'BaseDataModel') return cloneDeep(BaseDataModel)

    let pageCADL: Record<string, nt.PageObject>
    let pageYAML = ''
    let pageUrl = ''

    if (pageName.startsWith('~')) {
      pageUrl = !this.myBaseUrl ? this.baseUrl : this.myBaseUrl
      pageName = pageName.substring(2)
    } else {
      pageUrl = this.baseUrl
    }

    try {
      let url = `${pageUrl}${pageName}_en.yml`
      const [cadlObject, cadlYAML] = await fetchNoodlObject(url)
      pageCADL = cadlObject
      pageYAML = cadlYAML
    } catch (error) {
      throw error
    }

    return [pageCADL, pageYAML]
  }

  /**
   * Used to populate the references of the noodl files.
   *
   * @param ProcessPopulateArgs
   * @param ProcessPopulateArgs.source  The item being de-referenced.
   * @param ProcessPopulateArgs.lookFor  Reference tokens to look for e.g ['.','..'].
   * @param ProcessPopulateArgs.pageName
   * @param ProcessPopulateArgs.skip Keys that should not be de-referenced e.g ['name','country'].
   * @param ProcessPopulateArgs.withFns Choose to attach ecos functions to the source
   *
   * @returns The processed/de-referenced object.
   *
   */
  processPopulate({
    source,
    lookFor,
    skip,
    pageName,
    shouldAttachRef,
    withFns = true,
    wrapEvalObjects = true,
  }: {
    source: Record<string, any>
    lookFor: string[]
    pageName?: string
    skip?: string[]
    shouldAttachRef?: t.ShouldAttachRefFn
    withFns?: boolean
    wrapEvalObjects?: boolean
  }): Record<string, any> {
    let sourceCopy = source
    let localRoot = pageName ? sourceCopy[pageName] : sourceCopy
    let rootDeepCopy = cloneDeep(this.root)
    let localDeepCopy = clone(localRoot)

    for (const [op, locations] of [
      ['.', [rootDeepCopy]],
      ['..', [localDeepCopy]],
    ]) {
      let queueObject: t.ActiveQueueObject | undefined
      try {
        queueObject = this.#queue.create({
          type: 'populate',
          kind: 'keys',
          location: locations[0] === rootDeepCopy ? 'root' : 'local',
          operator: op as string,
          pageName,
        })
        sourceCopy = populateKeys({
          source: sourceCopy,
          lookFor: op as string,
          locations: locations as any[],
        })
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        queueObject && (queueObject.error = err)
        throw new PopulateError(err.message, 'keys')
      } finally {
        queueObject && this.#queue.remove(queueObject)
      }
    }

    localRoot = pageName ? sourceCopy[pageName] : sourceCopy

    {
      let queueObject: t.ActiveQueueObject | undefined
      try {
        queueObject = this.#queue.create({
          type: 'populate',
          kind: 'values',
          location: ['root', 'local'],
          operator: lookFor,
          pageName,
        })
        sourceCopy = populateVals({
          source: sourceCopy,
          lookFor,
          skip,
          locations: [this, rootDeepCopy, localDeepCopy],
          pageName,
          dispatch: this.dispatch.bind(this),
          shouldAttachRef,
        })
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        queueObject?.kind === 'values' && (queueObject.error = err)
        throw new PopulateError(err.message, 'values')
      } finally {
        queueObject && this.#queue.remove(queueObject)
      }
    }

    localRoot = pageName ? sourceCopy[pageName] : sourceCopy

    let result: any

    {
      let queueObject: t.ActiveQueueObject | undefined
      try {
        queueObject = this.#queue.create({
          type: 'populate',
          kind: 'functions',
          location: ['object'],
          operator: lookFor,
          pageName,
        })
        result = withFns
          ? createFuncAttacher({
              cadlObject: sourceCopy,
              dispatch: this.dispatch.bind(this),
            })
          : sourceCopy
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        queueObject?.kind === 'functions' && (queueObject.error = err)
        throw new PopulateError(err.message, 'functions')
      } finally {
        queueObject && this.#queue.remove(queueObject)
      }
    }

    return result
  }

  /**
   *
   * @param HandleEvalStringArgs.stringArg The item being de-referenced
   * @param HandleEvalStringArgs.pageName
   *
   * Used as a helper function for emitCall --> evalObject
   */
  async handleEvalString({ stringArg, pageName }) {
    for (const op of ['..', '.', '=', '~']) {
      if (stringArg.startsWith(op)) {
        // if (/sugges/i.test(stringArg)) debugger
        return populateString({
          source: stringArg,
          lookFor: op,
          locations: op == '~' ? [this] : [this.root, this.root[pageName]],
        })
      }
    }
  }

  /**
   *
   * @example
   * ```js
   * await handleEvalObject({ object: { '.path@': 5, '.path2@': 6 }, pageName: 'SignIn })
   * ```
   * @param HandleEvalObject.object series of commands in object {key:val} format
   * @param HandleEvalObject.pageName
   *
   * Used as a helper function for emitCall --> evalObject
   */
  async handleEvalObject({
    object,
    pageName,
  }: {
    object: nt.EvalActionObject['object']
    pageName?: string
  }) {
    let results: any
    if (u.isObj(object)) {
      for (const key of u.keys(object)) {
        const result = await this.handleEvalCommands({
          commands: object,
          key,
          pageName,
        })
        if (!u.isUnd(result)) {
          if (!results) {
            results = result
            continue
          }
          if (!u.isArr(results)) results = []
          results.push(result)
        }
      }
    }

    return results
  }

  /**
   * @param HandleEvalArray.pageName
   *
   * Used as a helper function for emitCall --> evalObject
   *
   * @example
   * ```
   * const result = await handleEvalArray([
   * 	  { '.path@': 3 },
   *    { 'path2@': 5 },
   *    { if: ['.condition', ifTrue, ifFalse] }
   * ])
   * ```
   */
  async handleEvalArray({
    array,
    pageName = '',
  }: {
    array: any[]
    pageName?: string
  }) {
    // log.debug(`[handleEvalArray]`,arguments[0])
    let results = [] as any[]
    for (const command of array) {
      /**
       * NOTE: object is being populated before running every command. This is done to ensure that the new change from a previous command is made available to the subsequent commands
       */
      let populatedCommand = await this.dispatch({
        type: c.dispatchActionType.POPULATE_OBJECT,
        payload: { pageName, object: command, copy: true },
      })

      if (nt.Identify.action.any(populatedCommand)) {
        populatedCommand = { actionType: populatedCommand }
      }

      for (const key of u.keys(populatedCommand)) {
        const result = await this.handleEvalCommands({
          commands: populatedCommand,
          key,
          pageName,
        })

        /**
         * When a popUp is received (which 99% of the time is signaling to abort everything) we immediately return the results with the popUp action object to the client so they're able to stop this action chain
         */
        if (hasAbortPopup(result)) return [...results, result]
        results.push(result)
      }
    }

    return results
  }

  /**
   * @param HandleEvalCommandsArgs.commands Series of commands to evaluate
   * @param HandleEvalCommandsArgs.key Key to a specified command within commands
   *
   * Used as a helper function for emitCall --> evalObject
   */
  async handleEvalCommands({ commands, key, pageName }) {
    let results: any

    if (key === 'if') {
      const result = await this.handleIfCommand({
        pageName,
        ifCommand: { [key]: commands[key] } as nt.IfObject,
      })

      if (!u.isNil(result)) {
        if (u.isUnd(results)) results = result
        else if (u.isArr(results)) results.push(result)
        else results = [results, result]
      }
    } else if (key === 'goto') {
      /**
       * object is being populated before running every command. This is done to ensure that the new change from a previous command is made available to the subsequent commands
       */
      const dataIn = commands[key]?.dataIn
      const shouldCopy =
        key.includes('builtIn') &&
        u.isObj(dataIn) &&
        !('object' in dataIn) &&
        !('array' in dataIn)

      const populatedCommand = await this.dispatch({
        type: c.dispatchActionType.POPULATE_OBJECT,
        payload: {
          pageName,
          object: { [key]: commands[key] },
          copy: shouldCopy,
        },
      })

      let gotoCommand: any

      if (u.isStr(populatedCommand[key])) {
        gotoCommand = {
          '=.builtIn.goto': {
            dataIn: { destination: populatedCommand[key] },
          },
        }
      } else if (u.isObj(populatedCommand[key])) {
        gotoCommand = {
          '=.builtIn.goto': populatedCommand[key],
        }
      }

      const result = await this.handleEvalFunction({
        command: gotoCommand,
        pageName,
        key: '=.builtIn.goto',
      })

      if (!u.isNil(result)) {
        if (u.isUnd(results)) results = result
        else if (u.isArr(results)) results.push(result)
        else results = [results, result]
      }
    } else if (key === 'actionType') {
      let result: any

      if (nt.Identify.action.evalObject(commands?.actionType)) {
        const obj = commands.actionType?.object
        if (u.isFnc(obj)) {
          result = await obj()
        } else if (u.isObj(obj)) {
          const payload = { updateObject: obj, pageName }

          result = await this.dispatch({
            type: c.dispatchActionType.EVAL_OBJECT,
            payload,
          })
        }
      } else {
        result = commands[key]
      }

      if (!u.isNil(result)) {
        if (u.isUnd(results)) results = result
        else if (u.isArr(results)) results.push(result)
        else results = [results, result]
      }
    } else if (!key.startsWith('=')) {
      const dataIn = commands[key]?.dataIn
      const shouldCopy =
        key.includes('builtIn') &&
        u.isObj(dataIn) &&
        !('object' in dataIn) &&
        !('array' in dataIn)

      const payload = {
        pageName,
        object: { [key]: commands[key] },
        copy: shouldCopy,
      }

      const populatedCommand = await this.dispatch({
        type: c.dispatchActionType.POPULATE_OBJECT,
        payload,
      })

      await this.handleEvalAssignmentExpressions({
        pageName,
        command: populatedCommand,
        key,
      })
    } else if (key.startsWith('=')) {
      /**
       * object is being populated before running every command. This is done to ensure that the new change from a previous command is made available to the subsequent commands
       */
      const dataIn = commands[key]?.dataIn
      const shouldCopy =
        key.includes('builtIn') &&
        (u.isObj(dataIn) || u.isArr(dataIn)) &&
        !('object' in dataIn) &&
        !('array' in dataIn)

      const payload = {
        pageName,
        object: { [key]: commands[key] },
        copy: shouldCopy,
      }

      const populatedCommand = await this.dispatch({
        type: c.dispatchActionType.POPULATE_OBJECT,
        payload,
      })

      const result = await this.handleEvalFunction({
        command: populatedCommand,
        pageName,
        key,
      })

      if (!u.isNil(result)) {
        if (u.isUnd(results)) results = result
        else if (u.isArr(results)) results.push(result)
        else results = [results, result]
      }
    }

    return results
  }

  /**
   *
   * @param HandleEvalAssignmentExpressionsArgs.command Assigment command of shape {'.path@':4}
   * @param HandleEvalAssignmentExpressionsArgs.pageName
   *
   * Used as a helper function for emitCall --> evalObject -->  handleEvalCommands
   */
  async handleEvalAssignmentExpressions({ pageName, command, key }) {
    //handles assignment expressions
    let trimPath = ''
    let val: any
    if (u.isArr(command[key])) {
      val = cloneDeep(command[key])
    } else {
      val = command[key]
    }

    if (key.startsWith('..')) {
      trimPath = key.substring(2, key.length - 1)
      let pathArr = trimPath.split('.')
      let currValue = get(this.root, [pageName, ...pathArr]) || ''

      if (u.isObj(currValue)) val = mergeDeep(currValue, val)
      if (isNoodlFunction(val)) {
        val = await this.handleEvalFunction({
          pageName,
          key: u.keys(val)[0],
          command: val,
        })
      }

      const payload = { pageName, dataKey: pathArr, value: val }

      this.emit({ type: c.emitType.SET_VALUE, payload })
    } else if (key.startsWith('.')) {
      trimPath = key.substring(1, key.length - 1)
      let pathArr = trimPath.split('.')
      let currValue = get(this.root, [...pathArr]) || ''

      if (u.isObj(currValue)) val = mergeDeep(currValue, val)
      if (isNoodlFunction(val)) {
        val = await this.handleEvalFunction({
          pageName,
          key: u.keys(val)[0],
          command: val,
        })
      }

      this.emit({
        type: c.emitType.SET_VALUE,
        payload: { dataKey: pathArr, value: val },
      })
    }
  }

  /**
   *
   * @param HandleEvalFunctionArgs.key
   * @param HandleEvalFunctionArgs.pageName
   * @param HandleEvalFunctionArgs.command
   * Used as a helper function for emitCall --> evalObject -->  handleEvalCommands
   */
  async handleEvalFunction({
    key = '',
    pageName = '',
    command,
  }: {
    command: Record<string, any>
    key: string
    pageName?: string
  }) {
    key = key || ''
    pageName = pageName || ''

    let results: any

    try {
      let trimPath = key.substring(key.startsWith('=..') ? 3 : 2, key.length)
      let pathArr = trimPath.split('.')
      let func = get(this.root, pathArr) || get(this.root[pageName], pathArr)

      if (u.isObj(func)) {
        if ('dataKey' in func) {
          func = { ...func, dataIn: func.dataKey, dataOut: func.dataKey }
          delete func?.dataKey
        }

        let obj = func

        for (const op of ['.', '..', '=', '~']) {
          obj = populateObject({
            // TODO - Find out if we can just do "obj" and not "op === '.' ? func : obj"
            source: u.isObj(obj) ? { ...obj } : obj,
            lookFor: op,
            locations: op == '~' ? [this] : [this.root, this.root[pageName]],
          })
        }
        //Using force for Global object that needs to
        //be processed since functions cannot be serialized
        //in localstorage and Global is retrieved from localstorage on page refresh
        func = createFuncAttacher({
          cadlObject: u.isObj(obj) ? { ...obj } : obj,
          dispatch: this.dispatch.bind(this),
          force:
            obj?.dataIn?.includes?.('Global') ||
            obj?.dataIn?.includes?.('Firebase')
              ? true
              : false,
        })
      }

      if (u.isFnc(func)) {
        if (u.isObj(command[key])) {
          // Value is set to the path in dataOut if dataOut is provided
          const { dataIn, dataOut } = command[key]
          // Returned value from the app level
          const result = await func(dataIn)
          if (dataOut) {
            if (u.isStr(dataOut)) {
              this.emit({
                type: c.emitType.SET_VALUE,
                payload: { dataKey: dataOut.split?.('.'), value: result },
              })
            } else if (u.isObj(dataOut)) {
              //
            }
            result && (results = result)
          } else if (dataIn && u.isUnd(dataOut)) {
            results = result
          }
        } else {
          // NOTE: command[key] may be an empty string here (which is ok)
          results = await func()
        }
      } else if (u.isArr(func)) {
        // shape --> ["FirebaseToken.response.name", () => {...}]
        // TODO - This is awkward. Find a better way to write this
        await func?.[1]?.()
      }
      key.includes('goto') && (results = { abort: true })
    } catch (error) {
      log.error(error)
    }

    return results
  }

  /**
   * Evaluates if objects of shape
   */
  async handleIfCommand({
    pageName,
    ifCommand,
  }: {
    pageName: string
    ifCommand: nt.IfObject
  }) {
    let condResult: any
    let [condExpr, valIfTruthy, valIfFalsy] = ifCommand?.if || []

    if (nt.Identify.isBoolean(condExpr)) {
      condResult = condExpr
    } else if (u.isFnc(condExpr)) {
      condResult = await condExpr()
    } else if (
      u.isStr(condExpr) &&
      ['.', '='].some((op) => condExpr.startsWith(op))
    ) {
      // condExpr is a reference
      let lookFor = ['..', '.', '='].find((op) => condExpr.startsWith(op))
      let res: any
      if (
        nt.Identify.localReference(condExpr) ||
        nt.Identify.evalLocalReference(condExpr)
      ) {
        res = populateString({
          source: condExpr,
          locations: [this.root[pageName]],
          lookFor: lookFor as string,
        })
      } else if (['.', '=.'].some((op) => condExpr.startsWith(op))) {
        res = populateString({
          source: condExpr,
          locations: [this.root],
          lookFor: lookFor as string,
        })
      }
      if (u.isFnc(res)) {
        condResult = await res()
      } else if (res && res !== condExpr) {
        condResult =
          condResult === nt.Identify.isBooleanFalse(condResult) ? false : true
      } else {
        condResult = false
      }
    } else if (u.isObj(condExpr) && u.keys(condExpr)[0]?.startsWith?.('=')) {
      // evalObject function evaluation
      condResult = await this.dispatch({
        type: c.dispatchActionType.EVAL_OBJECT,
        payload: { pageName, updateObject: condExpr },
      })
    }

    let isTruthy = !nt.Identify.isBooleanFalse(condResult) && !!condResult
    let value = isTruthy ? valIfTruthy : valIfFalsy
    let isObj = u.isObj(value)
    let firstKeyIfObj = (isObj && u.keys(value)[0]) || ''
    let lookFor = ''

    if (isObj && nt.Identify.folds.goto(value)) {
      if (u.isFnc(this.root.builtIn?.goto)) {
        const fn = this.root.builtIn.goto as t.BuiltInConsumerGotoFn
        value = populateVals({
          source: value,
          pageName,
          lookFor: ['..', '.', '='],
          locations: [this.root, this.root[pageName]],
        })
        let goto = value?.goto

        await fn?.({ pageName, goto: u.isObj(goto) ? goto.dataIn : goto })

        return { abort: 'true' }
      }
    } else if (u.isFnc(value)) {
      await value()
      return
    } else if (
      isObj &&
      (firstKeyIfObj.includes('@') || firstKeyIfObj.startsWith('='))
    ) {
      // console.trace()
      // evalObject is an assignment expression
      return void (await this.dispatch({
        type: c.dispatchActionType.EVAL_OBJECT,
        payload: { pageName, updateObject: value },
      }))
    } else if (nt.Identify.action.evalObject(value)) {
      const res = await this.dispatch({
        type: c.dispatchActionType.EVAL_OBJECT,
        payload: { pageName, updateObject: value?.object },
      })
      return res
    } else if (nt.Identify.action.any(value) || u.isArr(value)) {
      // Unhandled object expressions handled by the client/UI
      return value
    } else if (u.isStr(value)) {
      lookFor = ['..', '.', '='].find((op) => value.startsWith(op)) || ''
    }

    if (lookFor) {
      // References
      let res = populateString({
        source: value,
        locations: [this.root, this.root[pageName]],
        lookFor,
      })

      if (u.isFnc(res)) {
        // Function reference
        await res()
      } else if (u.isObj(res)) {
        // Object reference
        // Assuming it is an evalObject object function evaluation type
        const withFns = createFuncAttacher({
          cadlObject: res,
          dispatch: this.dispatch.bind(this),
        })
        const { dataIn, dataOut } = u.values(value)[0]
        if (u.isFnc(withFns)) {
          const result = dataIn ? await withFns(dataIn) : await withFns()

          if (dataOut) {
            this.emit({
              type: c.emitType.SET_VALUE,
              payload: { dataKey: dataOut.split('.'), value: result },
            })
          }
          return result
        } else if (u.isArr(withFns) && u.isFnc(withFns[1])) {
          const result = dataIn ? await withFns[1](dataIn) : await withFns[1]()
          if (dataOut) {
            this.emit({
              type: c.emitType.SET_VALUE,
              payload: { dataKey: dataOut.split('.'), value: result },
            })
          }
          return result
        }
      } else if (u.isArr(res) && u.isFnc(res?.[1])) {
        const result = await res[1]()
        return result
      } else {
        return res
      }
    } else {
      return value
    }
  }

  /**
   * Used for the actionType 'updateObject'. It updates the value of an object at the given path.
   *
   * @param UpdateObjectArgs
   * @param UpdateObjectArgs.dataKey The path to the property being changed.
   * @param UpdateObjectArgs.dataObject The object that will be updated.
   * @param UpdateObjectArgs.dataObjectKey The specific key of the dataObject to be used as the new value.
   * @emits CADL#stateChanged
   *
   */
  async updateObject({
    dataKey,
    dataObject,
    dataObjectKey,
  }: t.UpdateObjectArgs) {
    this.emit({
      type: c.emitType.SET_VALUE,
      payload: {
        dataKey: (dataKey.startsWith('.')
          ? dataKey.substring(1, dataKey.length)
          : dataKey
        ).split('.'),
        value: dataObjectKey ? dataObject[dataObjectKey] : dataObject,
        replace: true,
      },
    })
    await this.dispatch({ type: c.dispatchActionType.UPDATE_LOCAL_STORAGE })
  }

  /**
   * Runs the init functions of the page matching the pageName.
   *
   * @param pageObject
   * @param onBeforeInit
   * @param onInit
   * @param onAfterInit
   */
  async runInit<Init extends any[]>({
    pageObject = {},
    onBeforeInit,
    onInit,
    onAfterInit,
  }: {
    pageObject: Record<string, any>
    onBeforeInit?(init: Init): Promise<void> | void
    onInit?(current: any, index: number, init: Init): Promise<void> | void
    onAfterInit?(error: Error | null, init: Init): Promise<void> | void
  }): Promise<Record<string, any>> {
    return new Promise(async (resolve) => {
      let page = pageObject
      let pageName = u.keys(page)[0]
      let init = u.values(page)[0].init as Init

      if (init) {
        onBeforeInit && (await onBeforeInit?.(init))
        this.initCallQueue = init.map((_command, index) => index)

        while (this.initCallQueue.length > 0) {
          try {
            const currIndex = this.initCallQueue.shift()
            const command: any = init[currIndex]

            onInit && (await onInit?.(command, currIndex, init))

            let populatedCommand: any
            let firstCmdKey = (u.isObj(command) && u.keys(command)[0]) || ''

            if (
              u.isObj(command) &&
              ['=', '@'].some((op) => firstCmdKey.includes(op))
            ) {
              await this.dispatch({
                type: c.dispatchActionType.EVAL_OBJECT,
                payload: { updateObject: command, pageName },
              })
            } else if (isPopulated(command)) {
              populatedCommand = command
            } else {
              populatedCommand = populateVals({
                source: command,
                locations: [this.root, this.root[pageName]],
                lookFor: ['.', '..', '=', '~'],
              })
            }

            if (u.isFnc(populatedCommand)) {
              try {
                await populatedCommand()
              } catch (error) {
                const err =
                  error instanceof Error ? error : new Error(String(error))
                onAfterInit?.(err, init)
                throw new UnableToExecuteFn(
                  `An error occured while executing ${pageName}.init. Check command at index ${currIndex} under init`,
                  err,
                )
              }
            } else if (nt.Identify.action.any(populatedCommand)) {
              const { actionType, dataKey, dataObject, object, funcName } =
                populatedCommand

              switch (actionType) {
                case 'updateObject': {
                  await this.updateObject({ dataKey, dataObject })
                  break
                }
                case 'builtIn': {
                  if (funcName === 'videoChat') {
                    const videoChatFn = this.root.builtIn[funcName]
                    u.isFnc(videoChatFn) &&
                      (await videoChatFn?.(populatedCommand))
                  } else if (funcName === 'initExtend') {
                    const initExtendFn = this.root.builtIn[funcName]
                    u.isFnc(initExtendFn) &&
                      (await initExtendFn?.(populatedCommand))
                  }
                  break
                }
                case 'evalObject': {
                  const payload = { pageName, updateObject: object }
                  await this.dispatch({
                    type: c.dispatchActionType.EVAL_OBJECT,
                    payload,
                  })

                  break
                }
                default: {
                  return
                }
              }
            } else if (nt.Identify.if(populatedCommand)) {
              //TODO: add the then condition
              const ifResult = await this.handleIfCommand({
                pageName,
                ifCommand: populatedCommand,
              })
              if (ifResult?.abort) resolve({ abort: true })
            } else if (u.isArr(populatedCommand)) {
              if (u.isFnc(populatedCommand[0][1])) {
                try {
                  await populatedCommand[0][1]()
                } catch (error) {
                  throw new UnableToExecuteFn(
                    `An error occured while executing ${pageName}.init`,
                    error instanceof Error ? error : new Error(String(error)),
                  )
                }
              }
            }

            let updatedPage = this.root[pageName]

            for (const op of ['..', '.']) {
              updatedPage = populateObject({
                source: updatedPage,
                lookFor: op,
                skip: ['update', 'check', 'components'],
                locations: [op == '..' ? this.root[pageName] : this.root],
              })
            }

            updatedPage = createFuncAttacher({
              cadlObject: { [pageName]: updatedPage },
              dispatch: this.dispatch.bind(this),
            })

            page = updatedPage
            init = u.values(updatedPage)[0].init

            const payload = { pageName, properties: u.values(updatedPage)[0] }
            this.emit({ type: c.emitType.SET_LOCAL_PROPERTIES, payload })
          } catch (error) {
            log.error(error)
          }
        }
        await onAfterInit?.(null, init)
        resolve(page)
      }
    })
  }

  /**
   * Sets either the user or meetroom value from localStorage to the corresponding root value in memory
   *
   * @param key "user" | "meetroom"
   *
   */
  //TODO: ask Chris if he uses this
  setFromLocalStorage(key: 'meetroom' | 'user') {
    let localStorageGlobal: any
    try {
      const Global = localStorage.getItem('Global')
      if (Global) localStorageGlobal = JSON.parse(Global)
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error(String(error))
    }
    if (localStorageGlobal) {
      switch (key) {
        case 'user': {
          let user = localStorageGlobal.currentUser.vertex
          // this.emit({
          //   type: c.emitType.SET_VALUE,
          //   payload: { dataKey: 'Global.currentUser.vertex', value: user },
          // })
          break
        }
        case 'meetroom': {
          let currMeetroom = localStorageGlobal.meetroom.edge
          this.emit({
            type: c.emitType.SET_VALUE,
            payload: { dataKey: 'Global.meetroom.edge', value: currMeetroom },
          })
          break
        }
      }
    }
  }

  /**
   * Used to mutate the draft state.
   *
   * @param callback Function used to update the state
   */
  editDraft(callback: (draft: Draft<t.Root>) => void) {
    this.emit({ type: 'EDIT_DRAFT', payload: { callback } })
  }

  /**
   * Used to handle the emit syntax, where a series
   * of actions can be called given a common variable(s)
   * @param dataKey -object with variables e.g {var1:{name:'tom'}}
   * @param actions -an array of commands/actions to be performed
   * @param pageName
   * @returns { any[] }
   */
  async emitCall({
    dataKey,
    actions,
    pageName,
  }: t.EmitCallArgs): Promise<any[]> {
    const returnValues = {}
    const numActions = actions.length
    const queueObject = this.#queue.create({
      type: 'emit',
      kind: 'emit',
      pageName,
      numActions: actions?.length || 0,
    })

    try {
      for (let index = 0; index < numActions; index++) {
        let action = actions[index]
        // Handles explicit evalObject call
        if (u.isStr(action) && action.includes('=')) {
          action = { [action]: '' }
        }
        const clone = cloneDeep(action)
        const actionWithVals: Record<string, any> = replaceVars({
          vars: dataKey,
          source: clone,
        })
        if (nt.Identify.action.evalObject(action)) {
          try {
            // @ts-expect-error
            await (action?.object as (...args: any[]) => any)?.()
          } catch (error) {
            log.error(error)
          }
          const response = await this.dispatch({
            type: c.dispatchActionType.EVAL_OBJECT,
            payload: { pageName, updateObject: action?.object },
          })
          returnValues[index] = response || ''
        } else if (
          // Handles eval expressions associated to evalObject
          u.keys(action)[0].includes('@') ||
          u.keys(action)[0].startsWith('=')
        ) {
          const response = await this.dispatch({
            type: c.dispatchActionType.EVAL_OBJECT,
            payload: { pageName, updateObject: actionWithVals },
          })
          returnValues[index] = response || ''
        } else if ('if' in action) {
          const response = await this.handleIfCommand({
            pageName,
            ifCommand: actionWithVals as nt.IfObject,
          })
          returnValues[index] = response || ''
        } else if (nt.Identify.folds.goto(action)) {
          await this.handleEvalCommands({
            pageName,
            commands: actionWithVals,
            key: 'goto',
          })
        }
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error))
    } finally {
      this.#queue.remove(queueObject)
    }

    return u.values(returnValues)
  }

  getApiCache(cacheIndex) {
    return this.root.apiCache[cacheIndex].data
  }

  getState() {
    return {
      ...this.#state,
      ...this.#queue.getState(),
    }
  }

  getSubscribers() {
    return this.#subscribers
  }

  on(evt: t.ActiveQueueSubscribeEvent, callback: t.ActiveQueueSubscriber) {
    switch (evt) {
      case c.subscribe.QUEUE_START:
      case c.subscribe.QUEUE_END:
        return void this.#queue.on(evt, callback)
    }
  }

  get baseUrl() {
    return this.#baseUrl
  }

  set baseUrl(baseUrl) {
    if (this.cadlBaseUrl) {
      this.#baseUrl = baseUrl.replace('${cadlBaseUrl}', this.cadlBaseUrl)
    }
  }

  get cadlBaseUrl() {
    if (!this.#cadlBaseUrl) return undefined
    let withVersion = this.#cadlBaseUrl
    if (withVersion.includes('cadlVersion')) {
      withVersion = withVersion.replace('${cadlVersion}', this.cadlVersion)
    }
    if (withVersion.includes('designSuffix')) {
      withVersion = withVersion.replace('${designSuffix}', this.designSuffix)
    }
    return withVersion
  }

  set cadlBaseUrl(cadlBaseUrl) {
    this.#cadlBaseUrl = cadlBaseUrl
  }

  get assetsUrl() {
    return this.#assetsUrl
  }

  set assetsUrl(assetsUrl) {
    if (this.cadlBaseUrl) {
      this.#assetsUrl = assetsUrl.replace('${cadlBaseUrl}', this.cadlBaseUrl)
    }
  }

  get designSuffix() {
    const { greaterEqual, less, widthHeightRatioThreshold } = this.#designSuffix
    return this.aspectRatio >= widthHeightRatioThreshold ? greaterEqual : less
  }

  set designSuffix(designSuffix) {
    this.#designSuffix = designSuffix
  }

  get aspectRatio() {
    return this.#aspectRatio
  }

  set aspectRatio(aspectRatio) {
    this.#aspectRatio = aspectRatio
    if (this.cadlBaseUrl) this.#baseUrl = this.cadlBaseUrl
  }

  get root() {
    return this.#root
  }

  set root(root) {
    this.#root = root || {}
  }

  set apiVersion(apiVersion) {
    store.apiVersion = apiVersion
  }

  get apiVersion() {
    return store.apiVersion
  }

  get config() {
    return this.#config
  }
}
