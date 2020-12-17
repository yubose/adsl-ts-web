import { event as noodluiEvent } from 'noodl-ui'
import { RegisterOptions } from '../types'

export default {
  name: 'list',
  cond: (n, c) => !!c,
  resolve(node, component, { noodlui }: any) {
    component.on(
      noodluiEvent.component.list.CREATE_LIST_ITEM,
      (result, options) => {
        console.log(
          `%clist[${noodluiEvent.component.list.CREATE_LIST_ITEM}]`,
          `color:#95a5a6;font-weight:bold;`,
          { ...result, ...options },
        )

        const { listItem } = result
        noodlui.componentCache().set(listItem)
        // TODO - Unit test fails when this is uncommented. Double check the UI
        // const childNode = noodluidom.parse(listItem)
      },
    )

    component.on(
      noodluiEvent.component.list.REMOVE_LIST_ITEM,
      (result, options) => {
        console.log(
          `%clist[${noodluiEvent.component.list.REMOVE_LIST_ITEM}]`,
          `color:#95a5a6;font-weight:bold;`,
          { ...result, ...options },
        )
        const { listItem, successs } = result
        noodlui.componentCache().remove(listItem)
        const childNode = document.getElementById(listItem?.id)

        if (childNode) {
          console.log(
            '%cFound childNode for removed listItem. Removing it from the DOM now',
            `color:#95a5a6;font-weight:bold;`,
            { ...result, ...options, childNode },
          )
          // if (node.contains(childNode)) node.removeChild(childNode)
        } else {
          console.log(
            `%cCould not find the child DOM node for a removed listItem`,
            `color:#95a5a6;font-weight:bold;`,
            { ...result, ...options, id: listItem?.id, childNode },
          )
        }
      },
    )

    component.on(
      noodluiEvent.component.list.UPDATE_LIST_ITEM,
      (result, options, { noodluidom }: any) => {
        console.log(
          `%clist[${noodluiEvent.component.list.UPDATE_LIST_ITEM}]`,
          `color:#95a5a6;font-weight:bold;`,
          { ...result, ...options },
        )
        const { listItem, success } = result
        const childNode = document.getElementById(listItem?.id)

        // noodluidom.emit('list.item', childNode, listItem)
        noodluidom.redraw(childNode, listItem)
        if (childNode) {
          console.log(`Reached the childNode block for an updated listItem`, {
            ...result,
            ...options,
            childNode,
          })
        } else {
          console.error(`Could not find the DOM node for an updated listItem`, {
            ...result,
            ...options,
            listItem,
            childNode,
          })
        }
      },
    )
  },
} as RegisterOptions
