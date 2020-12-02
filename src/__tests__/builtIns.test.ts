import _ from 'lodash'
import sinon from 'sinon'
import { expect } from 'chai'
import { prettyDOM, waitFor } from '@testing-library/dom'
import { Component, ComponentObject, List, ListItem } from 'noodl-ui'
import { assetsUrl, noodlui, noodluidom, page } from '../utils/test-utils'
import createBuiltIns from '../handlers/builtIns'
import { saveOutput } from './helpers'

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
    let builtInRedrawObj = {
      actionType: 'builtIn',
      funcName: 'redraw',
      viewTag,
    }
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
      noodlui.actionsContext = { noodl: { emitCall: async () => [''] } } as any
      noodlui
        .removeCbs('emit')
        .setPage('SignIn')
        .use({
          getAssetsUrl: () => assetsUrl,
        })
      pathSpy = sinon.spy(async () =>
        path === 'male.png' ? 'female.png' : 'male.png',
      )
      onClickSpy = sinon.spy(async () => {
        console.info('hello?')
        return (path = path === 'male.png' ? 'female.png' : 'male.png')
      })
      redrawSpy = sinon.spy(noodluidom, 'redraw')
      noodlui
        .use({ actionType: 'emit', fn: pathSpy, trigger: 'path' })
        .use({ actionType: 'emit', fn: onClickSpy, trigger: 'onClick' })
        .use({
          getAssetsUrl: () => assetsUrl,
          getRoot: () => ({ SignIn: pageObject }),
        })
      list = page.render({
        type: 'list',
        iteratorVar,
        listObject,
        contentType: 'listObject',
        children: [
          {
            type: 'listItem',
            viewTag,
            children: [
              { type: 'label', dataKey: `${iteratorVar}.value`, iteratorVar },
              {
                type: 'image',
                path: { emit: { dataKey: { var1: 'f' }, actions: [] } },
                onClick: [
                  { emit: { dataKey: { v1: 'f' }, actions: [] } },
                  builtInRedrawObj,
                ],
              },
            ],
          },
        ],
      } as any).components[0]
    })

    after(() => {
      saveOutput('builtIns.test.json', list.toJS(), { spaces: 2 })
      console.info(noodlui.getCbs())
    })

    afterEach(() => {
      redrawSpy.restore()
    })

    it.only('should gather only the components that have the viewTag if a viewTag is provided', async () => {
      page.render({
        type: 'list',
        iteratorVar,
        listObject,
        contentType: 'listObject',
        children: [
          {
            type: 'listItem',
            viewTag,
            children: [
              { type: 'label', dataKey: `${iteratorVar}.value`, iteratorVar },
              {
                type: 'image',
                path: { emit: { dataKey: { var1: 'f' }, actions: [] } },
                onClick: [
                  { emit: { dataKey: { v1: 'f' }, actions: [] } },
                  { actionType: 'builtIn', funcName: 'redraw', viewTag },
                ],
              },
            ],
          },
        ],
      } as any)
      document.querySelector('img')?.click()
      await waitFor(() => {
        expect(redrawSpy.called).to.be.true
        saveOutput('redrawBuiltInCall.test.json', redrawSpy.args, {
          spaces: 2,
        })
      })
      redrawSpy.restore()
    })

    it('should rerender the same amount of nodes it was redrawed with', async () => {
      await waitFor(() => {
        expect(document.querySelector('img')).to.be.instanceOf(HTMLElement)
        expect(document.querySelectorAll('li')).to.have.length.greaterThan(
          listObject.length - 1,
        )
        // expect(document.querySelector('img')).to.have.property(
        //   'src',
        //   noodlui.assetsUrl + 'female.png',
        // )
        // // document.querySelector('img')?.click()
        // expect(document.querySelector('img')).to.have.property(
        //   'src',
        //   noodlui.assetsUrl + 'male.png',
        // )
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

    it('should redraw the node with the viewTag if viewTag is provided', async () => {
      const list = noodlui.resolveComponents({
        type: 'list',
        iteratorVar,
        listObject,
        contentType: 'listObject',
        children: [
          {
            type: 'listItem',
            viewTag,
            iteratorVar,
            children: [
              { type: 'label', dataKey: `${iteratorVar}.value`, iteratorVar },
              {
                type: 'image',
                iteratorVar,
                path: { emit: { dataKey: { var1: 'f' }, actions: [] } },
                onClick: [
                  { emit: { dataKey: { v1: 'f' }, actions: [] } },
                  {
                    actionType: 'builtIn',
                    funcName: 'redraw',
                    viewTag,
                  },
                ],
              },
            ],
          },
        ],
      }) as List
      let listItem = list.child()
      listItem?.setDataObject(listObject[0])
      let label = listItem?.child()
      let image = listItem?.child(1)
      noodluidom.parse(list)
      await waitFor(async () => {
        expect(document.querySelector('img')?.src).to.eq(
          assetsUrl + 'female.png',
        )
        listItem = list.child()
        listItem?.setDataObject(listObject[0])
        label = listItem?.child()
        image = listItem?.child(1)
        // await image?.get('onClick')()
        noodluidom.redraw(document.querySelector('img'), image)
        expect(document.querySelector('img')?.src).not.to.eq(
          assetsUrl + 'female.png',
        )

        // document.querySelector('img')?.click?.()
        // noodluidom.redraw(document.querySelector('img'), image)
        expect(document.querySelector('img')).to.exist
        expect(document.querySelector('img')?.src).to.eq(assetsUrl + 'male.png')
      })
      // await waitFor(() => {
      //   const img = document.querySelector('img')
      //   expect(img?.src).not.to.eq(assetsUrl + 'female.png')
      //   expect(img?.src).to.eq(assetsUrl + 'male.png')
      // })
      // const listData = list.getData().slice()
      // list.getData().forEach(() => {
      //   list.removeDataObject(0)
      //   if (list.length) list.removeChild(0)
      // })
      // if (list.length) list.removeChild(0)
      // listData.forEach((d, i) => {
      //   list.addDataObject(d)
      //   const listItemm = createComponent('listItem')
      //   listItemm.setDataObject(d)
      //   list.createChild(listItemm)
      // })
      // const listItem = list.child() as ListItem
      // const label = listItem.child() as Component
      // const image = listItem.child(1) as Component
      // await image.get('onClick')()

      // await waitFor(() => {
      //   expect(document.querySelector('img')).to.exist
      // })
    })

    xit('should redraw all nodes with the same viewTag if there are more than 1 of them', () => {
      //
    })

    xit('should fallback to redraw the node that called redraw if a viewTag isnt available', () => {
      //
    })
  })
})
