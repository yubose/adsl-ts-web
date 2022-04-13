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
import { actionFactory, componentFactory } from 'noodl-ui-test-utils'

export const ui = { ...actionFactory, ...componentFactory }

jest.mock('@/hooks/useGetNoodlPages')

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
  static?: { images?: any[] }
}

export function renderComponent(
  component:
    | Partial<React.ReactElement>
    | Partial<t.StaticComponentObject>
    | string,
  {
    builtIns,
    createActionChain,
    pageName = 'HomePage',
    root: rootProp = {},
    ...renderOptions
  }: Omit<RenderOptions, 'wrapper'> & AppTestRenderOptions = {},
) {
  // @ts-expect-error
  useGetNoodlPages.mockResolvedValue({
    allNoodlPage: { nodes: [] },
  })

  rootProp[pageName] = {
    ...rootProp[pageName],
    components: [
      ...((component ? u.array(component) : rootProp[pageName]?.components) ||
        []),
      ...(rootProp[pageName]?.components || []),
    ],
  }

  const pageContext = {
    isPreload: false,
    pageName,
    pageObject: rootProp[pageName],
    slug: `/${pageName}/`,
    _context_: { lists: {} },
  } as t.PageContext

  const Component = () => {
    const { root, getInRoot, setInRoot } = useRootObject(rootProp)

    let node: React.ReactElement | undefined

    if (React.isValidElement(component)) {
      node = component
    } else {
      const renderComponent = createRendererFactory({
        root,
        getInRoot,
        setInRoot,
        _context_: pageContext._context_,
        builtIns,
        createActionChain,
        pageName: pageContext.pageName,
        static: { images: [] },
      })(getElementProps)

      node = (
        <>
          {u.array(component).map((c) => (
            <React.Fragment key={c.id}>{renderComponent(c)}</React.Fragment>
          ))}
        </>
      )
    }

    return node
  }

  return originalRender(<Component />, {
    wrapper: getAllProviders({ pageContext }),
    static: { ...renderOptions?.static, images: [] },
    ...renderOptions,
  })
}

export * from '@testing-library/react'
