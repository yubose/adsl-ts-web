/**
 * TODO - Merge the duplicated code
 */
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

  function createSlownessMetricStartMark(
    name: string,
    options?: PerformanceMarkOptions,
  ) {
    if (!name.endsWith('start')) name += '-start'
    const detail = { currentPage: app.currentPage, ...options?.detail }
    return createMark(name, { ...options, detail })
  }

  function createSlownessMetricEndMark(
    name: string,
    options?: PerformanceMarkOptions,
  ) {
    if (!name.endsWith('end')) name += '-end'
    const detail = { currentPage: app.currentPage, ...options?.detail }
    return createMark(name, { ...options, detail })
  }

  function createSlownessMetric(
    name: string,
    start: PerformanceMark | string,
    end: PerformanceMark | string,
  ) {
    if (!name.endsWith('metric')) name += '-metric'
    return createMeasure(name, getMarkName(start), getMarkName(end))
  }

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
    const metric = createSlownessMetric(
      metricName,
      getMarkName(start as PerformanceMark),
      getMarkName(end as PerformanceMark),
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
      edge_id: app.root.Global.rootNotebookID,
      mediaType: c.mediaType.json,
      tags: commonTags,
      type: DocType.Slowness,
      content: data,
    })
    console.log(`[${metricName}] Log created`, doc)
    // debugger
    return doc
  }

  function createMemoryUsageMetricStartMark(
    name: string,
    options?: PerformanceMarkOptions,
  ) {
    if (!name.endsWith('start')) name += '-start'
    const detail = { ...getMemoryUsage(), ...options?.detail }
    return createMark(name, { ...options, detail })
  }

  function createMemoryUsageMetricEndMark(
    name: string,
    options?: PerformanceMarkOptions,
  ) {
    if (!name.endsWith('end')) name += '-end'
    const detail = { ...getMemoryUsage(), ...options?.detail }
    return createMark(name, { ...options, detail })
  }

  function createMemoryUsageMetric(
    name: string,
    start: PerformanceMark | string,
    end: PerformanceMark | string,
  ) {
    if (!name.endsWith('metric')) name += '-metric'
    return createMeasure(name, getMarkName(start), getMarkName(end))
  }

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
      const metric = createMemoryUsageMetric(
        metricName,
        getMarkName(start),
        getMarkName(end),
      )
      data.before = { ...start?.detail }
      data.after = { ...end?.detail }
    } else {
      Object.assign(data, getMemoryUsage())
    }
    const doc = await app.noodl.root.builtIn.utils.createMemoryUsageMetric({
      title: documentTitle,
      edge_id: app.root.Global.rootNotebookID,
      mediaType: c.mediaType.json,
      tags: commonTags,
      type: DocType.MemoryUsage,
      content: data,
    })
    console.log(`[${metricName}] Log created`, doc)
    // debugger
    return doc
  }

  return {
    createSlownessMetric,
    createSlownessMetricDocument,
    createSlownessMetricStartMark,
    createSlownessMetricEndMark,
    createMemoryUsageMetric,
    createMemoryUsageMetricDocument,
    createMemoryUsageMetricStartMark,
    createMemoryUsageMetricEndMark,
  }
}

export default createEcosLogger
