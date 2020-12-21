import isPlainObject from 'lodash/isPlainObject'
import noop from 'lodash/noop'
import { NOODLComponent, ProxiedComponent } from 'noodl-ui'
import { NOODLDOMElement } from 'noodl-ui-dom'
import Logger from 'logsnap'

const log = Logger.create('subparsers.ts')

export interface SubparserArgs {
  listData?: any[]
}

// Being used inside parseChildren
// NOTE: This is inactive and just here for potentially coming back
export async function parseList(
  node: NOODLDOMElement,
  props: ProxiedComponent,
) {
  const { default: noodlui } = await import('../app/noodl-ui')
  // const { parse } = parserOptions
  const parse = noop as any
  const blueprint: NOODLComponent = props.blueprint
  const listData = props['data-listdata']
  const listId = props['data-listid']

  listData.forEach((listItem) => {
    const component = noodlui.resolveComponents(blueprint)[0]
    const liNode = parse(component)
    if (liNode) {
      liNode.dataset['list-id'] = listId
      node.appendChild(liNode)
    } else {
      log.func('parseList')
      log.red(
        `Tried to create a list item DOM node but received null or undefined as a result`,
        { node, props },
      )
    }

    if (liNode && Array.isArray(blueprint?.children)) {
      blueprint.children.forEach((blueprintChild: NOODLComponent) => {
        const resolvedBlueprintChild = noodlui.resolveComponents(
          blueprintChild,
        )[0]
        if (
          typeof resolvedBlueprintChild === 'string' ||
          typeof resolvedBlueprintChild === 'number'
        ) {
          liNode.innerHTML += `${resolvedBlueprintChild}`
        } else if (isPlainObject(resolvedBlueprintChild)) {
          parse(resolvedBlueprintChild)
        }
      })
    }
  })
}
