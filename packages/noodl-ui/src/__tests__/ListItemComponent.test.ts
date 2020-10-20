import _ from 'lodash'
import { expect } from 'chai'
import { mock } from './mockData'
import ListItemComponent from '../ListItemComponent'

describe('ListItemComponent', () => {
  it('should automatically set the noodlType to "listItem"', () => {
    const component = new ListItemComponent()
    expect(component.noodlType).to.equal('listItem')
  })

  it('should set the data object', () => {
    const dataObject = { fruits: ['apple'] }
    const component = new ListItemComponent()
    component.setData(dataObject)
    expect(component.data()).to.equal(dataObject)
  })
})
