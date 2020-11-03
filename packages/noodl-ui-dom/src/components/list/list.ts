import { event as noodluiEvent, IList, IListItem } from 'noodl-ui'
import NOODLDOMBaseComponent from '../base'
import {
  INOODLDOMList,
  NOODLDOMConstructorArgs,
  NOODLDOMElement,
} from '../../types'

class NOODLDOMList<DOMNode extends NOODLDOMElement>
  extends NOODLDOMBaseComponent
  implements INOODLDOMList {
  #listItems: IListItem[] = []

  constructor(...args: NOODLDOMConstructorArgs<IList, DOMNode>) {
    super(...args)

    const [node, component] = args

    component.on(
      noodluiEvent.component.list.ADD_DATA_OBJECT,
      ({ dataObject, index, succeeded }, options) => {
        if (succeeded) {
          const listItemComponent = component.createChild(
            'listItem',
          ) as IListItem
          listItemComponent.setDataObject(dataObject)
          listItemComponent['listIndex'] = index
          this.addListItem(listItemComponent)
        }
      },
    )

    component.on(
      noodluiEvent.component.list.RETRIEVE_DATA_OBJECT,
      ({ index, dataObject, succeeded }, args) => {
        if (succeeded) {
          //
        }
      },
    )

    component.on(
      noodluiEvent.component.list.DELETE_DATA_OBJECT,
      ({ index, dataObject, succeeded }, args) => {
        if (succeeded) {
          this.removeListItem(index as number)
        }
      },
    )

    component.on(
      noodluiEvent.component.list.UPDATE_DATA_OBJECT,
      ({ index, dataObject, succeeded }, args) => {
        if (succeeded) {
          this.updateListItem(index as number, dataObject)
        }
      },
    )
  }

  addListItem(listItem: IListItem) {
    this.#listItems.push(listItem)
    return this
  }

  getListItem(index: number) {
    return this.#listItems[index] || null
  }

  removeListItem(index: number): this
  removeListItem(listItem: IListItem): this
  removeListItem(listItem: number | IListItem) {
    if (typeof listItem === 'number') {
      const index = listItem
      if (this.#listItems.length - 1 < index) {
        // log ?
      } else {
        const removedListItem = this.#listItems.splice(index, 1)[0]
      }
    } else {
      const index = this.#listItems.indexOf(listItem)
      if (index !== -1) {
        const removedListItem = this.#listItems.splice(index, 1)[0]
      }
    }
    return this
  }

  setListItem(index: number, listItem: IListItem) {
    this.#listItems[index] = listItem
    return this
  }

  updateListItem(index: number | IListItem, listItem?: IListItem) {
    if (arguments.length > 1) {
      this.#listItems[index as number] = listItem as IListItem
    } else {
      listItem = index as IListItem
      index = this.#listItems.indexOf(listItem)
      if (index !== -1) {
        const updatedListItem = this.#listItems.splice(index, 1, listItem)
      }
    }
    return this
  }
}

export default NOODLDOMList
