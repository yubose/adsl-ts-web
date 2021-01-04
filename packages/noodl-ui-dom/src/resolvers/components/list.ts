import { event as noodluiEvent, List, ListItem } from 'noodl-ui'
import { RegisterOptions } from '../../types'

export default {
  name: 'list',
  cond: 'list',
  before(node: HTMLUListElement, component, options) {
    // noodl-ui delegates the responsibility for us to decide how
    // to control how list children are first rendered to the DOM
    const listComponent = component as List
    const listObject = listComponent.getData()
    const numDataObjects = listObject?.length || 0
    listComponent.children().forEach((c: ListItem) => {
      c?.setDataObject?.(null)
      listComponent.removeDataObject(0)
    })
    listComponent.set('listObject', [])
    // Remove the placeholders
    for (let index = 0; index < numDataObjects; index++) {
      // This emits the "create list item" event that we should already have a listener for
      listComponent.addDataObject(listObject[index])
    }
  },
  resolve(node: HTMLUListElement, component: List, { noodlui, redraw }) {
    component.on(noodluiEvent.component.list.CREATE_LIST_ITEM, (result) => {
      noodlui?.componentCache().set(result.listItem)
    })

    component.on(noodluiEvent.component.list.REMOVE_LIST_ITEM, (result) => {
      noodlui?.componentCache().remove(result.listItem)
      document.getElementById(result.listItem.id)?.remove?.()
    })

    component.on(
      noodluiEvent.component.list.UPDATE_LIST_ITEM,
      (result, options) => {
        // const childNode = document.getElementById(result.listItem?.id)
        // redraw(childNode, result.listItem, options as any)
      },
    )
  },
} as RegisterOptions
