import * as u from '@jsmanifest/utils'
import React from 'react'
import { PageProps } from 'gatsby'
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
  const { pageObject } = pageContext

  const render = useRenderer()

  React.useEffect(() => {
    log.debug(`Props`, props)
    log.debug(`Page object`, pageObject)
  }, [])

  return (
    <>
      <Seo />
      {pageObject.components?.map?.(
        (c: t.StaticComponentObject, index: number) => (
          <React.Fragment key={c.id}>
            {render(c, ['HomePage', 'components', index])}
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
