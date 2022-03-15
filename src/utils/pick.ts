/**
 * Helpers for picking values from certain sets of shapes
 */
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import { isPage as isNuiPage, isNDOMPage } from 'noodl-ui'
import type { NDOM, NDOMPage, Page as NuiPage } from 'noodl-ui'
import type App from '../App'

export function pickDestination(
  value: string | nt.GotoObject | { dataIn?: { destination?: string } },
) {
  if (u.isStr(value)) return value
  if (u.isObj(value)) {
    if (u.isStr(value.dataIn)) return value.dataIn
    if (u.isObj(value.dataIn)) {
      return value.dataIn.destination || value.dataIn.goto || ''
    }
}

export function pickNuiPage(value: string | NuiPage | NDOMPage | undefined) {
  if (isNDOMPage(value)) return value.getNuiPage()
  return value as NuiPage
}

export function pickNdomPage(
  value: string | NuiPage | NDOMPage | undefined,
  opts?: { ndom?: NDOM },
) {
  if (u.isStr(value) || isNuiPage(value)) {
    return opts?.ndom?.findPage(value) as NDOMPage
  }
  return value as NDOMPage
}
