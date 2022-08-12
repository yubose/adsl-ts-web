import * as u from '@jsmanifest/utils'
import React from 'react'
import type { PageContext, StaticComponentObject } from '@/types'
import useRenderer from './useRenderer'

function usePage({ pageContext }: { pageContext: PageContext }) {
  const renderer = useRenderer()
  const render = (c: StaticComponentObject | string, index: number) => {
    return (
      <React.Fragment key={u.isStr(c) ? c : c?.id || c?.dataKey || index}>
        {renderer(c, [pageContext?.name || 'HomePage', 'components', index])}
      </React.Fragment>
    )
  }
  return {
    components: pageContext?.components || [],
    render,
  }
}

export default usePage
