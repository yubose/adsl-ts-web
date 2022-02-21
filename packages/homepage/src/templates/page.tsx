import React from 'react'
import * as u from '@jsmanifest/utils'
import { PageProps } from 'gatsby'
import Seo from '@/components/Seo'
import useRenderer from '@/hooks/useRenderer'
import { Provider as PageContextProvider } from '@/usePageCtx'
import * as t from '@/types'

interface NoodlPageTemplateProps extends PageProps {
  pageContext: t.PageContext
}

function NoodlPageTemplate(props: NoodlPageTemplateProps) {
  const { pageContext } = props
  const { pageName, pageObject } = pageContext
  const render = useRenderer()

  React.useEffect(() => {
    console.log(`pageContext`, pageContext)
    console.log(`pageObject`, pageObject)
  }, [])

  return (
    <>
      <Seo />
      {pageObject?.components?.map?.(
        (c: t.StaticComponentObject | string, index) => (
          <React.Fragment key={u.isStr(c) ? c : c.id || c.dataKey || index}>
            {render(c, [pageName, 'components', index])}
          </React.Fragment>
        ),
      ) || null}
    </>
  )
}

export default (props: NoodlPageTemplateProps) => (
  <PageContextProvider value={props.pageContext}>
    <NoodlPageTemplate {...props} />
  </PageContextProvider>
)
