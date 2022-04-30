import React from 'react'
import noop from 'lodash/noop'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import { toDataPath, trimReference } from 'noodl-utils'
import { render as originalRender, RenderOptions } from '@testing-library/react'
import { actionFactory, componentFactory } from 'noodl-ui-test-utils'
import { NUI as nui } from 'noodl-ui'
import AppProvider from '@/AppProvider'
import PageContext from '@/components/PageContext'
import type useActionChain from '@/hooks/useActionChain'
import type useBuiltInFns from '@/hooks/useBuiltInFns'
import usePage from '@/hooks/usePage'
import useGetNoodlPages from '@/hooks/useGetNoodlPages'
import useRenderer from '@/hooks/useRenderer'
import { usePageCtx } from '@/components/PageContext'
import * as t from '@/types'
import AiTmedContact from './fixtures/AiTmedContact.json'
import HaNauseaAndVomtingInChild from './fixtures/HaNauseaAndVomtingInChild.json'
import HomePage from './fixtures/HomePage.json'
import Resource from './fixtures/Resource.json'
import mergedPreloads from './fixtures/mergedPreloads.json'

const wwwRootObject = {
  AiTmedContact,
  HaNauseaAndVomtingInChild,
  HomePage,
  Resource,
  ...Resource,
  ...mergedPreloads,
}

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

/**
 * Root object of "www" config. Only includes AiTmedContact, HomePage and HaNauseaAndVomtingInChild pages
 */
export function getRoot() {
  return wwwRootObject
}

export async function getStaticPageComponents(
  pageComponents: nt.ComponentObject | nt.ComponentObject[],
) {
  const result = {} as {
    components: t.StaticComponentObject[]
    lists: t.PageContextListContextObject[]
  }
  const page = nui.getRootPage()
  const pageName = page.page || 'HomePage'
  result.components = (
    await nui.resolveComponents({
      components: u.array(pageComponents),
      page,
      on: {
        createComponent(comp, { path: componentPath }) {
          if (nt.Identify.component.list(comp)) {
            const iteratorVar = comp.blueprint?.iteratorVar || ''
            // This path is used to map list objects to their reference getters in the client
            const currListObjectPath = ([pageName, 'components'] as any[])
              .concat(componentPath)
              .concat('listObject')
              .reduce((acc, strOrIndex, i) => {
                if (
                  u.isNum(Number(strOrIndex)) &&
                  !Number.isNaN(Number(strOrIndex))
                ) {
                  acc += `[${strOrIndex}]`
                } else {
                  acc += i === 0 ? strOrIndex : `.${strOrIndex}`
                }
                return acc
              }, '')
            const listObject = comp.get('listObject') || []
            const refObject = u
              .values({} as any)
              .find((refObj) => refObj.path === currListObjectPath)

            result.lists = [
              {
                // Descendant component ids will be inserted here later
                children: [],
                componentPath,
                id: comp.id,
                iteratorVar,
                listObject: refObject?.ref || listObject,
              },
            ]
          }
        },
      },
    })
  )
    // @ts-expect-error
    .map((component) => component.toJSON()) as t.StaticComponentObject[]

  return result
}

/**
 *
 * @param { string } iteratorVar
 * @param { import('noodl-types').ComponentObject } component
 */
function getListObjectMapping(iteratorVar, component, path = []) {
  const mapping = {}

  /**
   * @param { Record<string, any> } obj
   */
  const mapProps = (obj, prefix = '', path = []) => {
    if (!u.isObj(obj)) return {}
    const mapped = {}

    for (const [key, value] of u.entries(obj)) {
      if (u.isStr(value) && value.startsWith(iteratorVar)) {
        if (prefix) path = path.concat(prefix)
        const currPath = path.concat(key).join('.')
        mapped[currPath] = {
          key,
          path: currPath,
          ref: value,
        }
      }
    }

    return mapped
  }
  if (iteratorVar && component) {
    u.assign(mapping, mapProps(u.omit(component, 'style'), '', path))
    u.assign(mapping, mapProps(component?.style, 'style', path))
  }

  component?.children?.forEach?.((child, index) =>
    u.assign(
      mapping,
      getListObjectMapping(iteratorVar, child, path.concat('children', index)),
    ),
  )

  return mapping
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
    pageContext: pageContextProp,
    root = {},
    ...renderOptions
  }: Omit<RenderOptions, 'wrapper'> & {
    pageContext?: Omit<t.PageContext, 'lists'> & {
      lists: t.PageContextListContextObject[]
    }
    root?: {
      [name: string]: Record<string, any>
    }
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
    assetsUrl: `https://public.aitmed.com/cadl/www4.06/assets/`,
    baseUrl: `https://public.aitmed.com/cadl/www4.06/`,
    pageObject: { components: u.array(component as any) },
    ...pageContextProp,
    slug: `/${pageContextProp?.pageName || 'HomePage'}/`,
  } as Omit<t.PageContext, 'lists'> & { lists: any }

  const Component = ({ pageContext }: { pageContext: t.PageContext }) => {
    const page = usePage({ pageContext })
    return <>{page.components.map(page.render)}</>
  }

  return {
    assetsUrl: `https://public.aitmed.com/cadl/www4.06/assets/`,
    baseUrl: `https://public.aitmed.com/cadl/www4.06/`,
    ...originalRender(<Component pageContext={pageContext} />, {
      wrapper: getAllProviders({ pageContext }),
      ...renderOptions,
    }),
  }
}

export * from '@testing-library/react'
