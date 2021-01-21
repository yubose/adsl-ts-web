import { expect } from 'chai'
import sinon from 'sinon'
import chalk from 'chalk'
import { ComponentObject } from 'noodl-types'
import ComponentResolver, {
  _store,
  dataResolverKeys,
  dataResolvers,
  getConsumerOptions,
  staticResolvers,
  identity,
} from '../temp/ComponentResolver'
import { presets } from '../constants'
import * as resolvers from '../temp/resolvers'
import * as T from '../types'
import { ResolverFn } from '../types'

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
        fontSize: '12',
        fontFamily: 'Roboto',
      },
    },
  ]
})

describe(chalk.keyword('orange')('ComponentResolver'), () => {
  describe(`composing`, () => {
    Object.values(staticResolvers).forEach((obj) => {
      it('should be a resolver object', () => {
        expect(obj).to.have.property('resolve')
      })
    })

    xit(`should return a function expecting 1 arg (the step fn)`, () => {
      const resolversList = Object.values(staticResolvers)
      const composed = composeResolvers(
        ...resolversList.reduce((acc, obj) => {
          return acc.concat(createResolverHOF(obj.resolve))
        }, []),
      )
      expect(composed).to.be.a('function')
      expect(composed.length).to.eq(1)
    })

    it(`should structurally be different than the component object passed in`, () => {
      const original = pageResolver.components[0]
      const component = pageResolver.resolveComponents()[0]
      expect(component).not.to.deep.eq(original)
    })

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
          children: [
            { type: 'view', children: [{ type: 'label', text: 'hello' }] },
          ],
        },
      } as ComponentObject
      const image = {
        type: 'image',
        style: { backgroundColor: '0x3304432' },
      } as ComponentObject
      pageResolver.components.push(view)
      pageResolver.components.push(image)
    })

    it(`should not duplicate components`, () => {
      const view = {
        type: 'view',
        children: [
          { type: 'view', children: [{ type: 'label', text: 'hello' }] },
        ],
      }
      const image = {
        type: 'image',
        style: { border: { style: '2' as const } },
      }

      pageResolver.components.push(view, image)
      expect(pageResolver.resolveComponents()).to.have.lengthOf(3)
    })
  })

  describe.only(`when getting the resolved results`, () => {
    it(`should resolve the border`, () => {
      const [result] = pageResolver.resolveComponents()
      expect(result.style).to.have.property('borderRadius', '0px')
      expect(result.style).to.have.property('borderStyle', 'none')
      expect(result.style).to.have.property('borderBottomStyle', 'solid')
      expect(result.style).not.to.have.property('border')
    })

    it(`should resolve the font`, () => {
      const [result] = pageResolver.resolveComponents()
      expect(result.style).to.have.property('fontSize', '12px')
      expect(result.style).to.have.property('fontFamily', 'Roboto')
    })

    it(`should resolve the colors`, () => {
      const [result] = pageResolver.resolveComponents()
      expect(result.style).to.have.property('color', '#03300033')
      expect(result.style).not.to.have.property('textColor')
      expect(result.style).to.have.property('backgroundColor', '#33004455')
    })
  })
})
