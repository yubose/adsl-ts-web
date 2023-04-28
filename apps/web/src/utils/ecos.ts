import * as u from '@jsmanifest/utils'
import { createMark, createMeasure, getMemoryUsage } from './performance'
import * as c from '../constants'
import type App from '../App'

export function createSlownessMetricDocument(app: App) {
  //
}

export async function createMemoryUsageMetricDocument({
  app,
  name,
  title = name,
  start,
  end,
  additionalData,
}: Parameters<
  App['noodl']['root']['builtIn']['utils']['createMemoryUsageMetric']
>[0]['content'] & {
  app: App
  name?: string
  title?: string
  start?: PerformanceMark | string
  end?: PerformanceMark | string
  tags?: string[]
  additionalData?: any
}) {
  const metric = createMeasure(name as string, start as string, end as string)
  return app.noodl.root.builtIn.utils.createMemoryUsageMetric({
    title,
    edge_id: app.root.Global.rootNotebookID,
    mediaType: 'application/json',
    tags: ['log'],
    type: 10100,
    content: {
      date: Date.now(),
      currentPage: app.currentPage,
      size: metric.duration,
      userAgent: navigator?.userAgent,
      ...getMemoryUsage(),
      ...additionalData,
      // ...(u.isObj(rest.content) ? rest.content : undefined),
    },
  })
}
