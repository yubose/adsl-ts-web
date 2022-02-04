import React from 'react'
import get from 'lodash/get'
import * as u from '@jsmanifest/utils'
import { render as originalRender, RenderOptions } from '@testing-library/react'
import { trimReference } from 'noodl-utils'
import AppProvider from '@/AppProvider'
import { Provider as PageContextProvider } from '@/usePageCtx'
import type useActionChain from '@/hooks/useActionChain'
import type useBuiltInFns from '@/hooks/useBuiltInFns'
import useGetNoodlPages from '@/hooks/useGetNoodlPages'
import useRootObject from '@/hooks/useRootObject'
import createRendererFactory from '@/utils/createRenderer'
import getElementProps from '@/utils/getElementProps'
import is from '@/utils/is'
import * as t from '@/types'

jest.mock('@/hooks/useGetNoodlPages')
jest.mock('@/hooks/useRootObject')

function getAllProviders({
  pageContext = {},
}: { pageContext?: Partial<t.PageContext> } = {}) {
  return function AllProviders({ children }: React.PropsWithChildren<any>) {
    return (
      <AppProvider>
        <PageContextProvider value={pageContext as t.PageContext}>
          {children}
        </PageContextProvider>
      </AppProvider>
    )
  }
}

export type AppTestRenderOptions = Partial<
  Pick<t.AppContext, 'getInRoot' | 'root' | 'setInRoot'>
> & {
  builtIns?: ReturnType<typeof useBuiltInFns>
  createActionChain?: ReturnType<typeof useActionChain>['createActionChain']
  pageName?: string
}

export function renderComponent(
  component:
    | Partial<React.ReactElement>
    | Partial<t.StaticComponentObject>
    | string,
  {
    builtIns,
    createActionChain,
    getInRoot,
    pageName = 'HomePage',
    root = {},
    setInRoot,
    ...renderOptions
  }: Omit<RenderOptions, 'wrapper'> & AppTestRenderOptions = {},
) {
  // @ts-expect-error
  useGetNoodlPages.mockResolvedValue({
    allNoodlPage: { nodes: [] },
  })

  // @ts-expect-error
  useRootObject.mockResolvedValue({
    root,
    getInRoot: (key = '') => {
      let datapath = ''
      if (is.reference(key)) {
        if (is.localReference(key)) {
          datapath = `${pageName}.${trimReference(key)}`
        }
      }
      return get(root, datapath)
    },
  })

  const pageContext = {
    isPreload: false,
    pageName,
    pageObject: {
      ...root[pageName],
      components: component ? u.array(component) : root[pageName]?.components,
    },
    slug: `/${pageName}/`,
    _context_: { lists: {} },
  } as t.PageContext

  let node: React.ReactElement | undefined

  if (React.isValidElement(component)) {
    node = component
  } else {
    node = createRendererFactory({
      _context_: pageContext._context_,
      builtIns,
      createActionChain,
      getInRoot,
      pageName: pageContext.pageName,
      root,
      setInRoot,
    })(getElementProps)(component)
  }

  return originalRender(node, {
    wrapper: getAllProviders({ pageContext }),
    ...renderOptions,
  })
}

export * from '@testing-library/react'
