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
    describe('passing an list item data', () => {
      xit('should add the list item data to the data list and add a new child into its children', () => {
        //
      })

      xit('should add a new child into its children', () => {
        //
      })
    })

    describe('passing the child instance to get the list item data', () => {
      xit('should add the list item data to the data list and add a new child into its children', () => {
        //
      })

      xit('should add a new child into its children', () => {
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
