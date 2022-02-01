import React from 'react'
import * as nt from 'noodl-types'
import * as u from '@jsmanifest/utils'
import get from 'lodash/get'
import set from 'lodash/set'
import { render, RenderResult } from '@testing-library/react'
import { graphql, useStaticQuery } from 'gatsby'
import AppProvider from '@/AppProvider'
import useCtx from '@/useCtx'
import useGetNoodlPages from '@/hooks/useGetNoodlPages'
import usePageCtx, { Provider as PageProvider } from '@/usePageCtx'
import useRenderer from '@/hooks/useRenderer'
import * as t from '@/types'
import createRendererFactory from '../createRenderer'
import getElementProps from '../getElementProps'

jest.mock('@/hooks/useGetNoodlPages')

const root = {
  pages: {
    HomePage: {
      formData: { email: 'pfft@gmail.com', age: 31 },
      components: [{ type: 'label', text: 'hello' }],
    },
  },
}

const getInRoot = (key = '') => get(root, key)
const setInRoot = (key = '', value: any) => set(root, key, value)

const wrapRenderComponent = (
  fn: (args: {
    component: Partial<t.StaticComponentObject> | string
    render: (
      value: Partial<t.StaticComponentObject> | string,
    ) => React.DOMElement<any, any>
  }) => RenderResult,
) => {
  return (component: Partial<t.StaticComponentObject> | string) =>
    fn({
      component,
      render: createRendererFactory({ root, getInRoot, setInRoot })(
        getElementProps,
      ),
    })
}

const renderComponent = wrapRenderComponent(
  ({ component, render: originalRender }) => {
    // @ts-expect-error
    useGetNoodlPages.mockResolvedValue({
      allNoodlPage: { nodes: [] },
    })

    const pageContext = {
      isPreload: false,
      pageName: 'HomePage',
      pageObject: {
        formData: { email: 'pfft@gmail.com', age: 31 },
        components: [{ type: 'label', text: 'hello' }] as any,
      },
      slug: '/HomePage/',
      _context_: {
        lists: {
          a: {
            children: [],
            id: 'abc',
            listObject: [],
            iteratorVar: 'itemObject',
            path: [],
          },
        },
      },
    } as t.PageContext

    return render(originalRender(component), {
      wrapper: ({ children }) => (
        <AppProvider>
          <PageProvider value={pageContext}>{children}</PageProvider>
        </AppProvider>
      ),
    })
  },
)

describe('createRendererFactory', () => {
  it('should render to the DOM', () => {
    const { getByText } = renderComponent({ type: 'label', text: 'hello' })
    expect(getByText('hello')).toBeInTheDocument()
  })
})
