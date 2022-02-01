import React from 'react'
import { PageProps } from 'gatsby'
import Seo from '@/components/Seo'
import useRenderer from '@/hooks/useRenderer'
import { Provider as PageContextProvider } from '@/usePageCtx'
import log from '@/utils/log'
import * as t from '@/types'

interface NoodlPageTemplateProps extends PageProps {
  pageContext: t.PageContext
}

if (typeof window !== 'undefined') {
  Object.defineProperties(window, {
    getComponentInfo: {
      value: function () {},
    },
  })
}

function NoodlPageTemplate(props: NoodlPageTemplateProps) {
  const { pageContext } = props
  const { pageObject } = pageContext
  const renderer = useRenderer()

  React.useEffect(() => {
    log.debug(`Props`, props)
  }, [])

  return (
    <>
      <Seo />
      {pageObject.components?.map?.((c: t.StaticComponentObject) => (
        <React.Fragment key={c.id}>
          {renderer.renderComponent(c)}
        </React.Fragment>
      )) || null}
    </>
  )
}

export default (props: NoodlPageTemplateProps) => (
  <PageContextProvider value={props.pageContext}>
    <NoodlPageTemplate {...props} />
  </PageContextProvider>
)
