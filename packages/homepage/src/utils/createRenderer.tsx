import React from 'react'
import curry from 'lodash/curry'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as c from '@/consts'
import * as t from '@/types'
import is from '@/utils/is'

export interface CreateRenderFactoryOptions {
  root: Record<string, any>
  getInRoot: t.AppContext['get']
  setInRoot: t.AppContext['set']
}

export type RenderUtils = Pick<
  CreateRenderFactoryOptions,
  'root' | 'getInRoot' | 'setInRoot'
>

const createRendererFactory = curry(
  (
    { getInRoot, setInRoot, root }: CreateRenderFactoryOptions,
    fn: (
      value: t.StaticComponentObject | nt.ReferenceString,
      utils: RenderUtils,
    ) => t.StaticComponentObject | null,
  ) => {
    return function render(
      value: t.StaticComponentObject | nt.ReferenceString,
    ) {
      if (u.isStr(value)) {
        if (is.reference(value)) value = getInRoot(value)
      }

      const component = fn(value, {
        root,
        getInRoot,
        setInRoot,
      })

      return component
    }
  },
)

export default createRendererFactory
