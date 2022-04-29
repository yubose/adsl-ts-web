import * as u from '@jsmanifest/utils'
import React from 'react'
import type { PageContext, StaticComponentObject } from '@/types'
import useRenderer from './useRenderer'

function usePage({ pageContext }: { pageContext: PageContext }) {
  const renderer = useRenderer()

  const render = (c: StaticComponentObject | string, index: number) => {
    console.log(`%c[usePage] Rendering`, `color:#08AD64;font-weight:bold;`, c)
    return (
      <React.Fragment key={u.isStr(c) ? c : c?.id || c?.dataKey || index}>
        {renderer(c, [
          pageContext?.pageName || pageContext?.startPage || 'HomePage',
          'components',
          index,
        ])}
      </React.Fragment>
    )
  }

  const components = pageContext?.pageObject?.components || []

  return {
    components,
    render,
  }
}

export default usePage
