import * as nt from 'noodl-types'
import {
  createMark,
  createMeasure,
  getMemoryUsage,
  getMarkName,
} from '../../utils/performance'
import { getUserAgent } from '../../utils/dom'
import * as c from '../../constants'
import type App from '../../App'
import type { MemoryUsageObject } from '../../utils/performance'

export enum DocType {
  Slowness = 10101,
  MemoryUsage = 10100,
}

export interface BaseMetricDocumentData {
  date?: number
  env?: nt.Env
  userAgent?: string
}

export interface SlownessMetricDocumentData extends BaseMetricDocumentData {
  metricName?: string
  currentPage?: string
  buildTimestamp?: string
  destination?: string
  size?: number
  [key: string]: any
}

export interface MemoryUsageMetricDocumentData
  extends BaseMetricDocumentData,
    MemoryUsageObject {
  metricName?: string
  currentPage?: string
  buildTimestamp?: string
  before?: MemoryUsageObject & { currentPage?: string; destination?: string }
  after?: MemoryUsageObject & { currentPage?: string }
  [key: string]: any
}

function createEcosLogger(app: App) {
  const commonTags = ['log']

  function getCommonNameFieldProps() {
    return {
      date: Date.now(),
      env: window.build?.ecosEnv,
      userAgent: getUserAgent(),
    }
  }

  function _internalCreateMark(type: 'end' | 'start', getDetail?: () => any) {
    return (name: string, options?: PerformanceMarkOptions) => {
      if (!name.endsWith(type)) name += `-${type}`
      return createMark(name, {
        ...options,
        detail: { ...getDetail?.(), ...options?.detail },
      })
    }
  }

  function _internalCreateMeasure(
    name: string,
    start: PerformanceMark,
    end: PerformanceMark,
  ) {
    if (!name.endsWith('metric')) name += '-metric'
    return createMeasure(name, getMarkName(start), getMarkName(end))
  }

  const createSlownessMetricStartMark = _internalCreateMark('start', () => ({
    currentPage: app.currentPage,
  }))

  const createSlownessMetricEndMark = _internalCreateMark('end', () => ({
    currentPage: app.currentPage,
  }))

  async function createSlownessMetricDocument({
    metricName = '',
    documentTitle = metricName,
    start,
    end,
    additionalData,
  }: {
    metricName?: string
    documentTitle?: string
    start?: PerformanceMark
    end?: PerformanceMark
    tags?: string[]
    additionalData?: any
  } = {}) {
    if (!documentTitle && metricName) documentTitle = metricName
    const metric = _internalCreateMeasure(
      metricName,
      start as PerformanceMark,
      end as PerformanceMark,
    )
    const data: SlownessMetricDocumentData = {
      metricName: metric.name,
      currentPage: app.currentPage,
      buildTimestamp: window.build?.timestamp,
      size: metric.duration,
      ...getCommonNameFieldProps(),
      ...additionalData,
    }
    if (start?.detail?.destination) {
      data.destination = start.detail.destination
    }
    if (start?.detail?.currentPage) {
      // The currentPage at the time of the start mark should be more accurate.
      data.currentPage = start.detail.currentPage
    }
    const doc = await app.noodl.root.builtIn.utils.createSlownessMetric({
      title: documentTitle,
      // admin side should use facility rootnotebook , otherwise will get error 'jwt permission deny' chenchen.xu 05/09/2023
      edge_id: app.root.Global.fac_rootNotebook
        ? app.root.Global.fac_rootNotebook 
        : app.root.Global.rootNotebookID,
      mediaType: c.mediaType.json,
      tags: commonTags,
      type: DocType.Slowness,
      content: data,
    })
    console.log(`[${metricName}] Log created`, doc)
    // debugger
    return doc
  }

  const createMemoryUsageMetricStartMark = _internalCreateMark(
    'start',
    getMemoryUsage,
  )

  const createMemoryUsageMetricEndMark = _internalCreateMark(
    'end',
    getMemoryUsage,
  )

  async function createMemoryUsageMetricDocument({
    metricName = '',
    documentTitle = metricName,
    start,
    end,
    additionalData,
  }: {
    metricName?: string
    documentTitle?: string
    start?: PerformanceMark
    end?: PerformanceMark
    tags?: string[]
    additionalData?: any
  } = {}) {
    if (!documentTitle && metricName) documentTitle = metricName
    if (metricName && !metricName.endsWith('metric')) {
      metricName += '-metric'
    }
    const data: MemoryUsageMetricDocumentData = {
      metricName,
      currentPage: app.currentPage,
      buildTimestamp: window.build?.timestamp,
      ...getCommonNameFieldProps(),
      ...additionalData,
    }
    if (start && end) {
      const metric = _internalCreateMeasure(
        metricName,
        start as PerformanceMark,
        end as PerformanceMark,
      )
      data.before = { ...start?.detail }
      data.after = { ...end?.detail }
    } else {
      Object.assign(data, getMemoryUsage())
    }
    const edge_id = app.root.Global.fac_rootNotebook
        ? app.root.Global.fac_rootNotebook 
        : app.root.Global.rootNotebookID
    if(edge_id){
      const doc = await app.noodl.root.builtIn.utils.createMemoryUsageMetric({
        title: documentTitle,
        edge_id: edge_id,
        mediaType: c.mediaType.json,
        tags: commonTags,
        type: DocType.MemoryUsage,
        content: data,
      })
      console.log(`[${metricName}] Log created`, doc)
      // debugger
      return doc
    }
    return
  }

  return {
    createMetric: _internalCreateMeasure,
    createMemoryUsageMetricDocument,
    createMemoryUsageMetricStartMark,
    createMemoryUsageMetricEndMark,
    createSlownessMetricDocument,
    createSlownessMetricStartMark,
    createSlownessMetricEndMark,
  }
}

export default createEcosLogger
