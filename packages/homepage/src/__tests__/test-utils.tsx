import React from 'react'
import get from 'lodash/get'
import * as u from '@jsmanifest/utils'
import { render as originalRender, RenderOptions } from '@testing-library/react'
import { trimReference } from 'noodl-utils'
import AppProvider from '@/AppProvider'
import PageContext from '@/components/PageContext'
import type useActionChain from '@/hooks/useActionChain'
import type useBuiltInFns from '@/hooks/useBuiltInFns'
import useGetNoodlPages from '@/hooks/useGetNoodlPages'
import { usePageCtx } from '@/components/PageContext'
import useRootObject from '@/hooks/useRootObject'
import createRendererFactory from '@/utils/createRenderer'
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
        <PageContext>{children}</PageContext>
      </AppProvider>
    )
  }
}

export type AppTestRenderOptions = Partial<
  Pick<t.AppContext, 'getR' | 'root' | 'setR'>
> & {
  builtIns?: ReturnType<typeof useBuiltInFns>
  createActionChain?: ReturnType<typeof useActionChain>['createActionChain']
  pageName?: string
  static?: { images?: any[] }
}

export function render(
  component: Partial<t.StaticComponentObject> | string,
  {
    builtIns,
    createActionChain,
    pageName = 'HomePage',
    root: rootProp = { Global: {} },
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
    pageName,
    pageObject: rootProp[pageName],
    lists: {},
    refs: {},
    slug: `/${pageName}/`,
  } as t.PageContext

  const Component = () => {
    const pageCtx = usePageCtx()
    const render = useRenderer()

    let node: React.ReactElement | undefined

    if (React.isValidElement(component)) {
      node = component
    } else {
      node = (
        <>
          {u.array(component).map((c, i) => (
            <React.Fragment key={i}>
              {render(c, [pageName, 'components', i])}
            </React.Fragment>
          ))}
        </>
      )
    }

    return node
  }

  return originalRender(<Component />, {
    wrapper: getAllProviders({ pageContext }),
    ...renderOptions,
  })
}

export * from '@testing-library/react'
