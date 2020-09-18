import _ from 'lodash'
import { NOODLComponent, NOODLComponentProps } from 'noodl-ui'
import { DOMNode, ParserOptions } from 'app/types'
import { noodl } from 'app/client'
import Logger from 'app/Logger'

const log = Logger.create('subparsers.ts')

export interface SubparserArgs {
  listData?: any[]
}

// Being used inside parseChildren
export function parseList(
  node: DOMNode,
  props: NOODLComponentProps,
  parserOptions: ParserOptions,
) {
  const { parse } = parserOptions
  const blueprint: NOODLComponent = props.blueprint
  const listData = props['data-listdata']
  const listId = props['data-listid']

  _.forEach(listData, (listItem) => {
    const component = noodl.resolveComponents(blueprint)[0]
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

    if (liNode && _.isArray(blueprint?.children)) {
      _.forEach(blueprint.children, (blueprintChild: NOODLComponent) => {
        const resolvedBlueprintChild = noodl.resolveComponents(
          blueprintChild,
        )[0]
        if (
          _.isString(resolvedBlueprintChild) ||
          _.isNumber(resolvedBlueprintChild)
        ) {
          liNode.innerHTML += `${resolvedBlueprintChild}`
        } else if (_.isPlainObject(resolvedBlueprintChild)) {
          parse(resolvedBlueprintChild)
        }
      })
    }
  })
}
