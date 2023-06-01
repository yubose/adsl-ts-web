import type { GetApiCacheManager } from '@aitmed/cadl'
import type { NUI as nui, NuiComponent, NDOM } from 'noodl-ui'
import type HTML2Canvas from 'html2canvas'
import type * as jsPDF from 'jspdf'
// import type echarts from '@types/echarts'
import type { Calendar } from '@fullcalendar/core'
import type Meeting from '../../meeting'
import type App from '../../app'
import type { TwilioVideo } from './twilio'

declare global {
  // const echarts: echarts
  const gridjs: any
  export const FullCalendar: {
    Calendar: typeof Calendar
  }

  export const html2canvas: typeof HTML2Canvas
  export const jspdf: typeof jsPDF

  const mapboxgl: any
  export const self: DedicatedWorkerGlobalScope

  export const Twilio = {
    Video: TwilioVideo,
  }

  interface Window {
    /**
     * This can be defined from the wrapping environment app to inject their own api cache manager. Useful when integrating local cache for desktop apps.
     *
     * The noodl-app desktop app wraps this web app and injects their own api cache manager. Their api cache stores data on the file system.
     *
     * See `src/noodl.ts` for referencing this entry point.
     */
    __NOODL_API_CACHE__?:
      | {
          limit?: number
          manager?: GetApiCacheManager
        }
      | undefined
    /** @deprecated */
    __NOODL_SDK_SEARCH_CLIENT__: any
    /** @deprecated */
    __NOODL_SEARCH_CLIENT__: any
    // Injected from noodl-app (Electron desktop app)
    __NOODL_SEARCH__: (options?: {
      sdk?: any
      meeting?: any
      nui?: any
      notification?: any
      registers?: any
      spinner?: any
    }) => {
      apiCache: {
        clear(): void
        createHash(value: any): string
        get(): Record<string, any>
        get(key: string): any
        get(key: 'limit'): number
        isHashExist(hash: string): boolean
        isHashStale(hash: string, limit?: number): boolean
        set(key: LiteralUnion<'limit', string>, value: any): void
      }
      searchClient: InstanceType<
        new (options?: BetterSQLite3Options) => {
          search(params: {
            api: 'cd' | 'ce' | 'cv' | 'dx' | 'rd' | 're' | 'rv'
            type: number // ex: 271361
            xfname?: string // ex: 'E.bvid|E.evid'
            id?: string // ex: '.Global.currentUser.vertex.id'
            maxcount?: string | number // ex: '500'
            obfname?: string // ex: 'mtime'
            ObjType?: number // ex: 3
            dataKey?: string // ex: 'apiRequest.facilityConnections.connectionList'
            key?: string // ex: '=..formData.searchContent'
            sCondition?: string // ex: 'E.type=10002 AND E.tage=1 AND E.subtype&0xff0000=0x30000'
            _nonce?: string // ex: '=.Global._nonce'
            [key: string]: any
          }): any
        }
      >
    }
    ac: any
    app: any
    build: any
    local: any
    cache: App['cache']
    chrome: any
    get: () => any
    noodl: any
    env: string | undefined
    FCMOnTokenReceive: any
    getDataValues: any
    components: NuiComponent.Instance[]
    pageObject: any
    pcomponents: NuiComponent.Instance[]
    meeting: typeof Meeting
    nui: typeof nui
    ndom: NDOM
    streams: any
    cp: Function
  }

  export interface Performance {
    memory: {
      totalJSHeapSize: number
      jsHeapSizeLimit: number
      usedJSHeapSize: number
    }
  }
}
