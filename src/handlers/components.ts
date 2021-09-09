import isPlainObject from 'lodash/isPlainObject'
import { ComponentObject } from 'noodl-types'
import { ComponentInstance, ConsumerOptions } from 'noodl-ui'
import App from '../App'

const createComponentResolver = function _createComponentResolver(app: App) {
  function resolveListChildren({
    parent,
    component,
  }: {
    parent: ComponentInstance | null
    component: ComponentInstance
    transform: (
      component: ComponentInstance,
      options: ConsumerOptions,
    ) => ComponentInstance
  } & ConsumerOptions) {
    const original = component.blueprint || {}
    let { listObject, iteratorVar = '' } = original

    function getChildrenKey() {
      return component.type === 'chatList' ? 'chatItem' : 'children'
    }

    function getListObject() {
      return original.listObject || []
    }

    function getRawBlueprint(component: ComponentInstance) {
      const childrenKey = getChildrenKey()
      const children = component.blueprint?.[childrenKey]
      const blueprint = Array.isArray(children)
        ? { ...children?.[0] }
        : children
      if (isPlainObject(blueprint) && childrenKey === 'chatItem') {
        blueprint.type = 'listItem'
      }
      return blueprint as ComponentObject
    }

    if (!Array.isArray(listObject)) {
      listObject = listObject ? [listObject] : []
    }

    if (component.length) {
      // Removes the placeholder and starts fresh
      component.children.length = 0
    }

    listObject.forEach((dataObject: any) => {
      const listItemBlueprint = getRawBlueprint(component)
    })
  }
}

export default createComponentResolver
