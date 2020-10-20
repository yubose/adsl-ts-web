import _ from 'lodash'
import { expect } from 'chai'
import { mock } from './mockData'
import ListComponent from '../ListComponent'

describe('ListComponent', () => {
  it('should return the list data', () => {
    const noodlListComponent = mock.raw.getNOODLList({
      iteratorVar: 'colorful',
    })
    const listComponent = new ListComponent(noodlListComponent)
    expect(listComponent.listObject).to.equal(noodlListComponent.listObject)
  })

  it('should return the iteratorVar', () => {
    const noodlListComponent = mock.raw.getNOODLList({
      iteratorVar: 'colorful',
    })
    const listComponent = new ListComponent(noodlListComponent)
    expect(listComponent.iteratorVar).to.equal(noodlListComponent.iteratorVar)
  })

  it('should update the list data in the state when set is setting a new listObject', () => {
    const newListData = [{ movies: ['rush hour 3', 'space jam'] }]
    const noodlListComponent = mock.raw.getNOODLList({
      iteratorVar: 'colorful',
    })
    const listComponent = new ListComponent(noodlListComponent)
    expect(listComponent.listObject).not.to.equal(newListData)
    listComponent.set('listObject', newListData)
    expect(listComponent.listObject).to.equal(newListData)
  })

  describe('addListItem', () => {
    describe('passing in list item data', () => {
      it('should add the list item data to the data list', () => {
        const newListItemData = { id: 'hello' }
        const noodlListComponent = mock.raw.getNOODLList({
          iteratorVar: 'colorful',
        })
        const listComponent = new ListComponent(noodlListComponent)
      })

      xit('should add a new child to its children', () => {
        //
      })
    })

    describe('passing the child instance to get the list item data from it instead', () => {
      xit('should add the list item data to the data list', () => {
        //
      })

      xit("should add the new child into its children if it doesn't already exist", () => {
        //
      })
    })
  })

  describe('set', () => {
    xit('should set the new list data', () => {
      //
    })

    xit("should refresh all of its children's data object to match the order of the list data", () => {
      //
    })
  })
})
