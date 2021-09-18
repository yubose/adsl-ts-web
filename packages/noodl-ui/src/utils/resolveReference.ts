import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as t from '../types'
import type NuiPage from '../Page'
import { defaultResolveReference } from './internal'

export default function resolveReference({
  component,
  key,
  value,
  page,
  root,
  localKey,
  on,
}: {
  component?: t.NuiComponent.Instance
  key?: string
  value?: any
  root: Record<string, any> | (() => Record<string, any>)
  localKey: string | undefined
  on?: t.On | undefined | null
  page?: NuiPage
}) {
  const getReference = (_value: any, on: t.On | null | undefined) => {
    if (on?.reference) {
      return on.reference({ component, page, key: key || '', value: _value })
    }
    return defaultResolveReference(root, localKey || page?.page, _value)
  }
  value = getReference(value, on)
  while (u.isStr(value) && nt.Identify.reference(value)) {
    value = getReference(value, on)
  }
  return value
}
