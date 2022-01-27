import React from 'react'
import * as u from '@jsmanifest/utils'
import { NUI as nui, NUITrigger, triggers } from 'noodl-ui'
import { PageProps } from 'gatsby'
import Layout from '../layout'
import Seo from '../components/Seo'
import useRenderer from '../hooks/useRenderer'
import { Provider as PageContextProvider } from '../usePageCtx'
import * as t from '../types'

const initialState = {
  components: {} as { [id: string]: { parentId: string; type: string } },
}

interface NoodlPageTemplateProps extends PageProps {
  pageContext: t.PageContext
}

if (typeof window !== 'undefined') {
  Object.defineProperties(window, {
    getComponentInfo: {
      get() {},
    },
  })
}

function NoodlPageTemplate(props: NoodlPageTemplateProps) {
  const { location, navigate, params, pageContext } = props
  const { pageName, pageObject } = pageContext

  const renderer = useRenderer()

  React.useEffect(() => {
    console.log(`Props`, props)
    console.log(`Page name`, pageName)
    console.log(`Page object`, pageObject)
  }, [])

  return (
    <Layout>
      <Seo />
      {pageObject.components?.map?.((c: t.StaticComponentObject) => (
        <React.Fragment key={c.id}>
          {renderer.renderComponent(c)}
        </React.Fragment>
      )) || null}
    </Layout>
  )
}

export default (props: NoodlPageTemplateProps) => (
  <PageContextProvider value={props.pageContext}>
    <NoodlPageTemplate {...props} />
  </PageContextProvider>
)
