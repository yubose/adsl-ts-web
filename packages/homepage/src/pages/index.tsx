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

function getTagName(type: string) {
  return {
    span: 'span',
    br: 'br',
    button: 'button',
    canvas: 'canvas',
    chart: 'div',
    date: 'input',
    dateSelect: 'input',
    divider: 'hr',
    ecosDoc: 'div',
    footer: 'div',
    header: 'div',
    searchBar: 'input',
    textField: 'input',
    image: 'img',
    label: 'div',
    list: 'ul',
    listItem: 'li',
    map: 'div',
    page: 'iframe',
    popUp: 'div',
    plugin: 'div',
    pluginHead: 'script',
    pluginBodyTail: 'script',
    register: 'div',
    scrollView: 'div',
    select: 'select',
    textView: 'textarea',
    video: 'video',
    view: 'div',
  }[type]
}

const initialState = {
  components: {} as { [id: string]: { parentId: string; type: string } },
}

export interface RenderComponentCallbackArgs {
  component: t.StaticComponentObject
  element: React.ReactElement
  tagName: string
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
  const [state, setState] = React.useState(() => {
    const st = {}
    for (const component of props.pageContext.components) {
      traverse(component, ({ component: comp, parent }) => {
        st[comp.id] = {
          id: comp.id,
          parent: u.omit(parent, ['children', 'parentId']),
        }
      })
    }
    return st
  })

  const ac = useActionChain()

  React.useEffect(() => {
    console.log(`[Homepage] state`, state)
    console.log(`[Homepage] props`, props)
    console.log(`[Homepage] components`, props.pageContext.components)
  }, [])

  const renderComponent = React.useCallback(
    (
      componentProp: t.StaticComponentObject,
      cb?: (args: RenderComponentCallbackArgs) => void,
    ) => {
      let { id, type, style, children: nchildren } = componentProp
      let props = { key: id, style } as Record<string, any>
      let children = [] as React.ReactElement[]

      if (nchildren && !u.isArr(nchildren)) nchildren = u.array(nchildren)

      nchildren.length &&
        (children = nchildren.map((c) => renderComponent(c, cb)))

      for (const [key, value] of u.entries(componentProp)) {
        if (key === 'children') {
          //
        } else if (['popUpView', 'viewTag'].includes(key as string)) {
          set(props, `dataset.viewtag`, value)
        } else if (key === 'data-value' && type === 'label') {
          children.push(value)
        } else if (key === 'data-src' && /(image|video)/i.test(type)) {
          props.src = value
        } else if (key === 'style') {
          //
        } else if (key === 'text' && !componentProp['data-value']) {
          value && children.push(value)
        } else if (triggers.includes(key as string)) {
          if (key === 'onClick') {
            const obj = value as t.StaticComponentObject[NUITrigger]
            const actions = obj?.actions || []
            const trigger = key as NUITrigger
            const actionChain = ac.createActionChain(trigger, actions)
            props[trigger] = actionChain.execute.bind(actionChain)
          }
        } else {
          if (
            !/(contentType|iteratorVar|itemObject|listObject|parentId|viewTag|videoFormat)/.test(
              key as any,
            )
          ) {
            props[key] = value
          }
        }
      }

      const tagName = getTagName(type)

      const element = React.createElement(
        tagName,
        props,
        children.length ? children : undefined,
      )

      cb?.({ component: componentProp, element, tagName })

      return element
    },
    [],
  )

  return (
    <Layout>
      <Seo />
      {props.pageContext.components.map((c) => renderComponent(c))}
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
