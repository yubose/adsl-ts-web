import * as u from '@jsmanifest/utils'
import React from 'react'
import type { PageProps as GatsbyPageProps } from 'gatsby'
import type { PageContext, StaticComponentObject } from '@/types'
import useRenderer from './useRenderer'
import useCtx from '@/useCtx'

function usePage({
  pageContext,
  ...rest
}: GatsbyPageProps & {
  pageContext: PageContext
}) {
  const { root } = useCtx()
  const renderer = useRenderer()

  const render = (c: StaticComponentObject | string, index: number) => {
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

  React.useEffect(() => {
    console.log(`rest`, rest)
    console.log(`pageContext`, pageContext)
    console.log(`pageObject`, pageContext.pageObject)
  }, [pageContext, rest])

  return {
    components: pageContext?.pageObject?.components || [],
    render,
  }
}

export default usePage
