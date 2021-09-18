import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import resolveReference from './resolveReference'
import type NuiPage from '../Page'
import type { NuiComponent, On } from '../types'

export default function resolvePageComponentUrl({
  root,
  component,
  page,
  localKey = page?.page || '',
  key = '',
  value,
  on,
}: {
  component?: NuiComponent.Instance
  key?: string
  value?: any
  root: Record<string, any> | (() => Record<string, any>)
  localKey: string | undefined
  on?: On | undefined | null
  page?: NuiPage
}): nt.PageComponentUrl {
  let { currentPage, targetPage, viewTag } = new nu.Parser().destination(value)

  if (on?.pageComponentUrl) {
    return on?.pageComponentUrl({
      component,
      page,
      key,
      value,
    }) as nt.PageComponentUrl
  }

  if (nt.Identify.reference(currentPage)) {
    currentPage = resolveReference({
      component,
      page,
      key,
      value: currentPage,
      localKey,
      on,
      root,
    })
  }

  if (nt.Identify.reference(targetPage)) {
    targetPage = resolveReference({
      component,
      page,
      key,
      value: targetPage,
      localKey,
      on,
      root,
    })
  }

  if (nt.Identify.reference(viewTag)) {
    viewTag = resolveReference({
      component,
      page,
      key,
      value: viewTag,
      localKey,
      on,
      root,
    })
  }

  return `${targetPage}@${currentPage}#${viewTag}`
}
