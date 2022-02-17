import * as u from '@jsmanifest/utils'
import type { PageObject } from 'noodl-types'
import React from 'react'
import type { PageProps } from 'gatsby'
import Seo from '@/components/Seo'
import useRenderer from '@/hooks/useRenderer'
import { Provider as PageContextProvider } from '@/usePageCtx'
import log from '@/utils/log'
import * as t from '@/types'

interface HomepageProps extends PageProps {
  pageContext: t.PageContext
}

function Homepage(props: HomepageProps) {
  const { pageContext } = props
  const { pageObject = {} as PageObject } = pageContext

  const render = useRenderer()

  return (
    <>
      <Seo />
      {pageObject.components?.map?.(
        (c: t.StaticComponentObject, index: number) => (
          <React.Fragment key={c.id}>
            {render(c, [
              pageContext?.startPage || 'HomePage',
              'components',
              index,
            ])}
          </React.Fragment>
        ),
      ) || null}
    </>
  )
}

export default (props: HomepageProps) => (
  <PageContextProvider value={props.pageContext}>
    <Homepage {...props} />
  </PageContextProvider>
)
