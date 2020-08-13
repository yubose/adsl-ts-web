// @ts-nocheck
import React from 'react'
import { render } from '@testing-library/react'
import {
  getElementType,
  getAlignAttrs,
  getBorderAttrs,
  getCustomDataAttrs,
  getChildren,
  getColors,
  getEventHandlers,
  getFontAttrs,
  getPosition,
  getReferences,
  getResolverOptions,
  getStylesByElementType,
  getSizes,
  getTransformedAliases,
  getTransformedStyleAliases,
  ProxiedComponent,
  useNOODL,
  Resolver,
  NOODLComponentProps,
} from 'react-noodl'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import { noodl } from 'app/client'
import rootReducer, { rootInitialState } from 'app/rootReducer'
import renderers from 'features/noodl/renderers'

function getRootInitialState(initialState: any) {
  return Object.keys(initialState || {}).reduce((acc: any, stateKey) => {
    if (stateKey) {
      if (acc[stateKey]) {
        acc[stateKey] = {
          ...acc[stateKey],
          ...initialState[stateKey],
        }
      }
    }
    return acc
  }, rootInitialState)
}

export function prepareWrapper({
  initialState,
  store = createStore(
    rootReducer,
    initialState ? getRootInitialState(initialState) : rootInitialState,
  ),
}: any = {}) {
  return ({ children }: { children?: React.ReactNode }) => {
    return <Provider store={store}>{children}</Provider>
  }
}

function customRender(ui: any, options: any = {}) {
  const { store, initialState, ...rest } = options
  const wrapper = prepareWrapper({ initialState, store })
  return render(ui, { wrapper, ...rest })
}

export function MockComponent(props: {
  cadlComponent: ProxiedComponent
  component: React.ElementType<any>
  page: any
  root?: { [key: string]: any }
  children?(parsedComponent: NOODLComponentProps<HTMLElement>): React.ReactNode
  render?(parsedComponent: NOODLComponentProps<HTMLElement>): React.ReactNode
}) {
  const { cadlComponent, page, root } = props
  const roots = { ...noodl.root, ...root }
  const viewport = { width: 375, height: 667 }
  const assetsUrl = noodl.assetsUrl
  const resolvers: Resolver[] = [
    getElementType,
    getAlignAttrs,
    getBorderAttrs,
    getCustomDataAttrs,
    getChildren,
    getColors,
    getEventHandlers,
    getFontAttrs,
    getPosition,
    getReferences,
    getStylesByElementType,
    getSizes,
    getTransformedAliases,
    getTransformedStyleAliases,
  ]
  const { getDataValues, resolveComponent } = useNOODL({
    assetsUrl,
    roots: { ...noodl.root, ...root },
    viewport,
    page,
    reinitiateOn: 'pageObject',
    resolvers,
  })
  const parsedComponent = resolveComponent(
    cadlComponent,
    getResolverOptions({
      assetsUrl,
      getDataValues,
      page,
      resolvers,
      resolveComponent,
      roots,
      viewport,
    }),
  )
  let Component = props.component || renderers[parsedComponent.type]
  return <Component {...parsedComponent} />
  // return <>{render?.(parsedComponent) || children?.(parsedComponent)}</>
}

// export function parseNOODLComponentProps({ component, page, root }: { component: ProxiedComponent; page: { name: string; object: any }, root?: any }) {
//   return getResolverOptions({
//     assetsUrl: noodl.assetsUrl || '',
//     page,
//     roots: { ...noodl.root, ...root },
//     viewport: { width: 375, height: 667 },
//   })
// }

export function createBasicFormElements(
  fieldDescriptions: Array<{ name: string; type: string; value?: string }>,
  { onChange }: any = {},
) {
  return fieldDescriptions.map((field: any) => {
    const props: any = {}
    if (['input', 'select', 'textarea'].includes(field.type)) {
      props.onChange = onChange
    }
    const { type, ...fieldProps } = field
    if (type === 'input') props.type = 'text'
    return React.createElement(type, { ...props, ...fieldProps })
  })
}

export * from '@testing-library/react'
export { customRender as render }
