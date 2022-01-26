import React from 'react'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import set from 'lodash/set'
import { NUI as nui, NUITrigger, triggers } from 'noodl-ui'
import { Link, PageProps } from 'gatsby'
import { css } from '@emotion/css'
import Layout from '../layout'
import Seo from '../components/Seo'
import useActionChain from '../hooks/useActionChain'
import useRenderer from '../hooks/useRenderer'
import type { RenderComponentCallbackArgs } from '../hooks/useRenderer'
import is from '../utils/is'
import * as t from '../types'

nui.use({
  getRoot: () => ({}),
  getAssetsUrl: () => 'http://127.0.0.1:3001/assets/',
  getBaseUrl: () => 'http://127.0.0.1:3001/',
  getPreloadPages: () => [],
  getPages: () => ['HomePage'],
  emit: {
    onClick: async (action, options) => {
      console.log(`[emit]`, { action, options })
    },
  },
  evalObject: [
    async (action, options) => {
      console.log(`[evalObject]`, { action, options })
    },
  ],
  goto: [
    async (action, options) => {
      console.log(`[goto]`, { action, options })
    },
  ],
})

const initialState = {
  components: {} as { [id: string]: { parentId: string; type: string } },
}

interface NoodlPageTemplateProps extends PageProps {
  pageContext: {
    isPreload: boolean
    pageName: string
    pageObject: nt.PageObject
    slug: string
  }
}

function NoodlPageTemplate(props: NoodlPageTemplateProps) {
  const { location, params, pageContext } = props
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
          {renderer.renderComponent(c, pageContext)}
        </React.Fragment>
      )) || null}
    </Layout>
  )
}

export function getServerData(props) {
  // console.log(`[getServerData] Props`, props)
  return {
    props: {},
  }
}

export default NoodlPageTemplate
