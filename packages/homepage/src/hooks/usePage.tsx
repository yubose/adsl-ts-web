import * as u from '@jsmanifest/utils'
import React from 'react'
import type { PageProps as GatsbyPageProps } from 'gatsby'
import type { PageContext, StaticComponentObject } from '@/types'
import useRenderer from './useRenderer'

function usePage({
  pageContext,
}: GatsbyPageProps & {
  pageContext: PageContext
}) {
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

  const components = React.useMemo(
    () => pageContext?.pageObject?.components || [],
    [pageContext],
  )

  return {
    components,
    render,
  }
}

export default usePage
