import _ from 'lodash'
import { mock } from './mockData'
import ListComponent from '../ListComponent'
import Component from '../Component'

describe('ListComponent', () => {
  it('should return the data object', () => {
    const listComponent = new ListComponent(
      mock.raw.getNOODLList({
        iteratorVar: 'colorful',
      }),
    )
    // console.info(listComponent)
  })
})
