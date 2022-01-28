import * as u from '@jsmanifest/utils'
import React from 'react'
import { graphql, PageProps } from 'gatsby'
import { createComponent, publish } from 'noodl-ui'
import Seo from '@/components/Seo'
import useRenderer from '@/hooks/useRenderer'
import usePageCtx, { Provider as PageContextProvider } from '@/usePageCtx'
import log from '@/utils/log'
import * as t from '@/types'
import is from '@/utils/is'

const initialState = {
  components: {} as { [id: string]: { parentId: string; type: string } },
}

interface HomepageProps extends PageProps {
  pageContext: t.PageContext
}

function Homepage(props: PageProps) {
  const { pageContext } = props
  const pageName = 'HomePage'
  const pageObject = pageContext.pageObject

  const renderer = useRenderer()

  React.useEffect(() => {
    log.debug(`Props`, props)
    log.debug(`Page name`, pageName)
    log.debug(`Page object`, pageObject)
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

export const query = graphql`
  query {
    noodlPage(name: { eq: "HomePage" }) {
      name
      slug
      content
    }
  }
`

export default (
  props: HomepageProps & {
    data: {
      noodlPage: {
        content: string
        name: string
        slug: string
      }
    }
  },
) => {
  const pageObject = {
    components: JSON.parse(props.data.noodlPage.content).components,
  }
  const lists = {}
  // Insert all descendants id's to the list component's children list.
  // This enables the mapping in the client side
  pageObject.components.forEach((component) => {
    publish(component, (comp) => {
      component = createComponent(component)

      if (is.component.list(comp)) {
        // comp = createComponent(comp)

        const listObject = comp.listObject || []

        if (!lists[comp.id])
          lists[comp.id] = {
            id: comp.id,
            children: [],
            iteratorVar: comp.iteratorVar,
            listObject,
          }

        const ctx = lists[comp.id]

        if (!ctx.children) ctx.children = []

        comp.children.forEach((child, index) => {
          if (!ctx.children[index]) ctx.children[index] = []
          if (!ctx.children[index].includes(child.id)) {
            ctx.children[index].push(child.id)
          }

          publish(child, (c) => {
            child = createComponent(child)
            if (!ctx.children[index].includes(c.id)) {
              ctx.children[index].push(c.id)
            }
          })
        })
      }
    })
  })

  return (
    // Simulate the PageContextProvider from NoodlPageTemplate
    <PageContextProvider
      value={{
        _context_: {
          lists,
        },
        isPreload: false,
        pageName: 'HomePage',
        pageObject,
        slug: props.data.noodlPage.slug,
      }}
    >
      <Homepage
        {...props}
        pageContext={{
          ...props.pageContext,
          _context_: {
            lists,
          },
          isPreload: false,
          pageName: 'HomePage',
          pageObject,
          slug: props.data.noodlPage.slug,
        }}
      />
    </PageContextProvider>
  )
}
