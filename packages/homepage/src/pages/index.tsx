import * as u from '@jsmanifest/utils'
import React from 'react'
import set from 'lodash/set'
import type { ComponentObject } from 'noodl-types'
import {
  createAction,
  createActionChain,
  NUI as nui,
  NUITrigger,
  triggers,
} from 'noodl-ui'
import { Link, PageProps } from 'gatsby'
import { css } from '@emotion/css'
import Layout from '../layout'
import Seo from '../components/Seo'
import useActionChain from '../hooks/useActionChain'
import useRenderer from '../hooks/useRenderer'
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

const traverse = (
  component: t.StaticComponentObject,
  cb: (args: {
    component: t.StaticComponentObject
    parent: ComponentObject | null
  }) => void,
) => {
  for (const child of u.array(component.children).filter(Boolean)) {
    cb({ component: child, parent: component || null })
    if (child?.children) {
      traverse(child.children, cb)
    }
  }
}

function IndexPage(
  props: PageProps<{}, { components: t.StaticComponentObject[] }>,
) {
  // const [state, setState] = React.useState(() => {
  //   const st = {}
  //   for (const component of props.pageContext.components) {
  //     traverse(component, ({ component: comp, parent }) => {
  //       st[comp.id] = {
  //         id: comp.id,
  //         parent: u.omit(parent, ['children', 'parentId']),
  //       }
  //     })
  //   }
  //   return st
  // })

  const ac = useActionChain()
  const renderer = useRenderer()

  React.useEffect(() => {
    // console.log(`[Homepage] state`, state)
    console.log(`[Homepage] props`, props)
    console.log(`[Homepage] components`, props.pageContext.components)
  }, [])

  return (
    <Layout>
      <Seo />
      {/* {props.pageContext.components.map((c) => renderer.renderComponent(c))} */}
    </Layout>
  )
}

// export async function getServerData() {
//   try {
//     const { default: axios } = await import('axios')
//     const { default: y } = await import('yaml')
//     const res = await axios.get(`https://public.aitmed.com/config/www.yml`)
//     return {
//       props: y.parse(res.data),
//     }
//   } catch (error) {
//     return {
//       status: 500,
//       headers: {},
//       props: {},
//     }
//   }
// }

export default IndexPage
