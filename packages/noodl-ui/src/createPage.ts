// @ts-nocheck
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import NuiPage from './Page'
import NuiViewport from './Viewport'
import * as c from './constants'
import * as t from './types'

export interface OnChangeFn {
  (prevPage: string, nextPage: string): void
}

function createPage(args: {
  id?: string
  name?: string
  onChange?: OnChangeFn
  viewport?: NuiViewport | { width: number; height: number }
}): NuiPage

function createPage(component: t.NuiComponent.Instance): NuiPage

function createPage(pageName: string): NuiPage

function createPage(
  args?:
    | string
    /**
     * If a component instance is given, we must set its page id to the component id, emit the PAGE_CREATED component event and set the "page" prop using the page instance
     */
    | t.NuiComponent.Instance
    | {
        name?: string
        component?: t.NuiComponent.Instance
        id?: string
        onChange?(prev: string, next: string): void
        viewport?: NuiViewport | { width?: number; height?: number }
      },
  opts:
    | {
        onChange?(prev: string, next: string): void
        viewport?: NuiViewport | { width?: number; height?: number }
      }
    | never = {},
) {}

export default createPage
