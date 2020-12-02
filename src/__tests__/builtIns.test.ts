import _ from 'lodash'
import sinon from 'sinon'
import { expect } from 'chai'
import { prettyDOM, waitFor } from '@testing-library/dom'
import { Component, ComponentObject, List, ListItem } from 'noodl-ui'
import {
  assetsUrl,
  createComponent,
  createNOODLComponent,
  noodlui,
  noodluidom,
  page,
} from '../utils/test-utils'
import createBuiltIns from '../handlers/builtIns'
import { saveOutput } from './helpers'

before(() => {})

describe('builtIns', () => {
  describe('redraw', async () => {
    let onClickSpy: sinon.SinonSpy<[], Promise<'male.png' | 'female.png'>>
    let pathSpy: sinon.SinonSpy<[], Promise<'male.png' | 'female.png'>>
    let redrawSpy: sinon.SinonSpy<[
      node: HTMLElement | null,
      component: Component,
      opts?:
        | {
            dataObject?: any
            resolver?:
              | ((
                  noodlComponent: ComponentObject | ComponentObject[],
                ) => Component)
              | undefined
          }
        | undefined,
    ]>
    let viewTag = 'genderTag'
    let view: Component
    let list: List
    let iteratorVar = 'itemObject'
    let listObject: { key: 'gender'; value: 'Male' | 'Female' | 'Other' }[]
    let pageObject = { genderInfo: { gender: 'Female' } }
    let path = 'male.png'

    beforeEach(() => {
      listObject = [
        { key: 'gender', value: 'Male' },
        { key: 'gender', value: 'Female' },
        { key: 'gender', value: 'Other' },
      ]
      pathSpy = sinon.spy(async () =>
        path === 'male.png' ? 'female.png' : 'male.png',
      )
      onClickSpy = sinon.spy(async () => {
        return (path = path === 'male.png' ? 'female.png' : 'male.png')
      })
      redrawSpy = sinon.spy(noodluidom, 'redraw')
      noodlui.actionsContext = { noodl: { emitCall: async () => [''] } } as any
      noodlui
        .removeCbs('emit')
        .setPage('SignIn')
        .use({ actionType: 'emit', fn: pathSpy, trigger: 'path' })
        .use({ actionType: 'emit', fn: onClickSpy, trigger: 'onClick' })
        .use({
          getAssetsUrl: () => assetsUrl,
          getRoot: () => ({ SignIn: pageObject }),
        })
      view = page.render({
        type: 'view',
        children: [
          {
            type: 'list',
            iteratorVar,
            listObject,
            contentType: 'listObject',
            children: [
              {
                type: 'listItem',
                viewTag,
                children: [
                  {
                    type: 'label',
                    dataKey: `${iteratorVar}.value`,
                    iteratorVar,
                  },
                  createNOODLComponent('image', {
                    path: 'emit',
                    onClick: ['emit', `builtIn:redraw:viewTag:${viewTag}`],
                  }),
                ],
              },
            ],
          },
        ],
      } as any).components[0]
      list = view.child() as List
    })

    after(() => {
      let outputArgs = { spaces: 2 }
      saveOutput('builtIns.test.json', list.toJS(), outputArgs)
      saveOutput('redrawBuiltInCall.test.json', redrawSpy.args, outputArgs)
    })

    afterEach(() => {
      redrawSpy.restore()
    })

    it('should pass in the viewTag and the dataObject', async () => {
      document.querySelector('img')?.click()
      await waitFor(() => {
        expect(redrawSpy.args[0][2]).to.have.property('viewTag', viewTag)
        expect(redrawSpy.args[0][2]).to.have.property('dataObject')
      })
    })

    it('should gather only the components that have the viewTag if a viewTag is provided', async () => {
      document.querySelector('img')?.click()
      await waitFor(() => {
        expect(redrawSpy.called).to.be.true
        expect(redrawSpy.callCount).to.eq(listObject.length)
      })
    })

    it('should rerender the same amount of nodes it was redrawed with', async () => {
      document.querySelector('img')?.click()
      document.querySelector('img')?.click()
      await waitFor(() => {
        expect(document.querySelector('img')).to.be.instanceOf(HTMLElement)
        expect(document.querySelectorAll('li').length).eq(listObject.length)
      })
      document.querySelectorAll('li').forEach((elem) => {
        expect(elem.children).to.have.lengthOf(
          list.original.children[0].children.length,
        )
      })
      let listItem = list.child() as ListItem
    })

    xit('label DOM nodes should still be there', () => {
      //
    })

    xit('image DOM nodes should still be there', () => {
      //
    })

    xit('should all display their own data from their own data object', () => {
      //
    })

    xit('should redraw all nodes with the same viewTag if there are more than 1 of them', () => {
      //
    })

    xit('should fallback to redraw the node that called redraw if a viewTag isnt available', () => {
      //
    })
  })
})
