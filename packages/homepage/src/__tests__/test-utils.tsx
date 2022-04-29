import React from 'react'
import noop from 'lodash/noop'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import { render as originalRender, RenderOptions } from '@testing-library/react'
import AppProvider from '@/AppProvider'
import PageContext from '@/components/PageContext'
import type useActionChain from '@/hooks/useActionChain'
import type useBuiltInFns from '@/hooks/useBuiltInFns'
import usePage from '@/hooks/usePage'
import useGetNoodlPages from '@/hooks/useGetNoodlPages'
import useRenderer from '@/hooks/useRenderer'
import { usePageCtx } from '@/components/PageContext'
import * as t from '@/types'
import { actionFactory, componentFactory } from 'noodl-ui-test-utils'

export const ui = { ...actionFactory, ...componentFactory }
export const baseUrl = 'https://127.0.0.1:3001/'
export const assetsUrl = `${baseUrl}assets/`

jest.mock('@/hooks/useGetNoodlPages')

export const defaultPageContext: t.PageContext = {
  assetsUrl,
  baseUrl,
  lists: [],
  pageName: 'Topo',
  pageObject: { components: [] },
  refs: {},
  getCtxObject: noop as any,
  getDataObject: noop as any,
  getIteratorVar: noop as any,
  getListObject: noop as any,
  getListsCtxObject: noop as any,
  isCtxObj: noop as any,
  isListConsumer: noop as any,
  slug: '',
}

function getAllProviders({
  pageContext,
}: {
  pageContext?: t.PageContext
} = {}) {
  return function AllProviders({ children }: React.PropsWithChildren<any>) {
    return (
      <AppProvider>
        <PageContext {...pageContext}>{children}</PageContext>
      </AppProvider>
    )
  }
}

export function render(
  component:
    | nt.ReferenceString
    | nt.ComponentObject
    | Partial<t.StaticComponentObject>
    | (
        | nt.ReferenceString
        | Partial<t.StaticComponentObject | nt.ComponentObject>
      )[],
  {
    pageName = 'HomePage',
    root = {},
    ...renderOptions
  }: Omit<RenderOptions, 'wrapper'> & {
    root?: {
      [name: string]: Record<string, any>
    }
    pageName?: string
  } = {},
) {
  // @ts-expect-error
  useGetNoodlPages.mockReturnValue({
    nodes: u.entries(root).reduce(
      (acc, [name, content]) =>
        acc.concat({
          name,
          content: u.isStr(content) ? content : JSON.stringify(content),
          slug: name,
          isPreload: false,
        }),
      [],
    ),
  })

  const pageContext = {
    ...defaultPageContext,
    pageName,
    pageObject: { components: u.array(component as any) },
    slug: `/${pageName}/`,
  } as t.PageContext

  const Component = ({ pageContext }: { pageContext: t.PageContext }) => {
    const page = usePage({ pageContext })
    return <>{page.components.map(page.render)}</>
  }

  return originalRender(<Component pageContext={pageContext} />, {
    wrapper: getAllProviders({ pageContext }),
    ...renderOptions,
  })
}

export * from '@testing-library/react'
