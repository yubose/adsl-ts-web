import _ from 'lodash'
import { expect } from 'chai'
import { mock } from './mockData'
import Component from '../Component'
import ListItemComponent from '../ListItemComponent'

describe('ListItemComponent', () => {
  it('should automatically set the noodlType to "listItem"', () => {
    const component = new ListItemComponent()
    expect(component.noodlType).to.equal('listItem')
  })

  it('should set the data object', () => {
    const dataObject = { fruits: ['apple'] }
    const component = new ListItemComponent()
    component.setDataObject(dataObject)
    expect(component.getDataObject()).to.equal(dataObject)
  })

  it('should return the parent list component', () => {
    const component = new ListItemComponent()
    const child = new Component({ type: 'view' })
    component.createChild(child)
    expect(child.parent()).to.equal(component)
  })
})
