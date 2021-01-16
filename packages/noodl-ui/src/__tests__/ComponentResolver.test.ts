import { expect } from 'chai'
import sinon from 'sinon'
import chalk from 'chalk'
import ComponentResolver from '../temp/ComponentResolver'
import * as T from '../types'
import { ComponentObject } from 'noodl-types'

let pageResolver: ReturnType<typeof ComponentResolver['createPage']>

beforeEach(() => {
  pageResolver = ComponentResolver.createPage()
  pageResolver.components = [
    {
      type: 'view',
      style: {
        border: { style: '2' },
        textColor: '0x03300033',
        backgroundColor: '0x33004455',
      },
    },
  ]
})

describe(chalk.keyword('orange')('ComponentResolver'), () => {
  describe(`composing`, () => {
    // it(`should return a curry function that is declaring one parameter (step)`, () => {
    //   const spy = sinon.spy(compose)
    //   const composed = spy(...fns.map(createResolverHOF))
    //   expect(composed).to.have.lengthOf(1)
    // })
    // it(`should return a function that composed all of the reducers and declared two parameters (this is a reducer)`, () => {
    //   const composed = compose(...fns.map(createResolverHOF))
    //   const spy = sinon.spy(composed)
    //   expect(spy(step)).to.have.lengthOf(2)
    // })
    it(`should run all the resolvers and return a resolved component`, () => {
      const view = {
        type: 'view',
        style: {
          border: { style: '2' },
          textColor: '0x03300033',
          backgroundColor: '0x33004455',
        },
      } as ComponentObject
      const image = {
        type: 'image',
        style: { backgroundColor: '0x3304432' },
      } as ComponentObject
      pageResolver.components.push(view)
      pageResolver.components.push(image)
      console.info(pageResolver.resolveComponents())
    })
  })
})
