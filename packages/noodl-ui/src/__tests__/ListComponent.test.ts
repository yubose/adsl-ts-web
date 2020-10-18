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
    expect(listComponent.data()).to.equal(noodlListComponent.listObject)
  })

  it('should return the iteratorVar', () => {
    const noodlListComponent = mock.raw.getNOODLList({
      iteratorVar: 'colorful',
    })
    const listComponent = new ListComponent(noodlListComponent)
    expect(listComponent.iteratorVar()).to.equal(noodlListComponent.iteratorVar)
  })

  it('should update the list data in the state when set is setting a new listObject', () => {
    const newListData = [{ movies: ['rush hour 3', 'space jam'] }]
    const noodlListComponent = mock.raw.getNOODLList({
      iteratorVar: 'colorful',
    })
    const listComponent = new ListComponent(noodlListComponent)
    expect(listComponent.data()).not.to.equal(newListData)
    listComponent.set('listObject', newListData)
    expect(listComponent.data()).to.equal(newListData)
  })
})
