import React from 'react'
import * as nt from 'noodl-types'
import * as u from '@jsmanifest/utils'
import get from 'lodash/get'
import set from 'lodash/set'
import merge from 'lodash/merge'
import { prettyDOM, render, RenderResult } from '@testing-library/react'
import { graphql, useStaticQuery } from 'gatsby'
import AppProvider from '@/AppProvider'
import useActionChain from '@/hooks/useActionChain'
import useCtx from '@/useCtx'
import useGetNoodlPages from '@/hooks/useGetNoodlPages'
import usePageCtx, { Provider as PageProvider } from '@/usePageCtx'
import useRenderer from '@/hooks/useRenderer'
import useRootObject from '@/hooks/useRootObject'
import PageTemplate from '@/templates/page'
import { Provider as PageContextProvider } from '@/usePageCtx'
import * as t from '@/types'
import createRendererFactory, {
  CreateRenderFactoryOptions,
} from '../utils/createRenderer'
import getElementProps from '../utils/getElementProps'

jest.mock('@/hooks/useGetNoodlPages')

const UnderlyingComponent = ({
  initialRoot = {},
  render,
}: {
  initialRoot?: Record<string, any>
  render: (
    options: CreateRenderFactoryOptions & t.AppContext,
  ) => React.ReactNode
}) => {
  const ac = useActionChain()
  const ctx = useCtx()

  React.useEffect(() => {
    ctx.setInRoot(initialRoot)
  }, [])

  return (
    <React.Fragment>
      {render({
        ...ctx,
        createActionChain: ac.createActionChain,
      } as CreateRenderFactoryOptions & t.AppContext)}
    </React.Fragment>
  )
}

const renderComponent = ({
  _context_ = { lists: {} },
  component,
  pageName = 'HomePage',
  root = {},
}) => {
  // @ts-expect-error
  useGetNoodlPages.mockResolvedValue({
    allNoodlPage: { nodes: [] },
  })

  const pageContext = {
    isPreload: false,
    pageName,
    pageObject: {
      ...root[pageName],
      components: component ? u.array(component) : root[pageName]?.components,
    },
    slug: `/${pageName}/`,
    _context_,
  } as t.PageContext

  return render(
    <PageContextProvider value={pageContext}>
      <UnderlyingComponent
        initialRoot={root}
        render={(args) =>
          createRendererFactory({
            ...args,
            pageName: pageContext.pageName,
            _context_,
          })(getElementProps)(component)
        }
      />
    </PageContextProvider>,
    { wrapper: ({ children }) => <AppProvider>{children}</AppProvider> },
  )
}

describe('render', () => {
  it('should render to the DOM', () => {
    const { getByText } = renderComponent({
      component: { type: 'label', text: 'hello' },
    })
    expect(getByText('hello')).toBeInTheDocument()
  })

  it(`should be able to render referenced components`, () => {
    const component = { '.BaseHeader': null }
    const { getByText } = renderComponent({
      component,
      root: {
        HomePage: { components: [component] },
        BaseHeader: { type: 'button', text: 'Submit' },
      },
    })
    expect(getByText('Submit')).toBeInTheDocument()
  })
})
