import sinon from 'sinon'
import { expect } from 'chai'
import { prettyDOM, waitFor } from '@testing-library/dom'
import { List } from 'noodl-ui'
import { assetsUrl, noodlui, noodluidom } from '../utils/test-utils'
import createBuiltIns from '../handlers/builtIns'

describe('builtIns', () => {
  describe('redraw', async () => {
    let pageObject = { genderInfo: { gender: 'Female' } }
    let currentPath = 'male.png'
    let pathSpy = sinon.spy(async () =>
      currentPath === 'male.png' ? 'female.png' : 'male.png',
    )
    let onClickSpy = sinon.spy(async () => {
      console.info('hello?')
      return (currentPath =
        currentPath === 'male.png' ? 'female.png' : 'male.png')
    })
    const viewTag = 'genderTag'
    const iteratorVar = 'itemObject'
    let listObject: { key: 'gender'; value: 'Male' | 'Female' | 'Other' }[]

    beforeEach(() => {
      listObject = [
        { key: 'gender', value: 'Male' },
        { key: 'gender', value: 'Female' },
        { key: 'gender', value: 'Other' },
      ]
      pageObject = { genderInfo: { gender: 'Female' } }
      noodlui.actionsContext = { noodl: { emitCall: async () => [''] } } as any
      // @ts-expect-error
      noodlui
        .removeCbs('emit')
        .setAssetsUrl(assetsUrl)
        .setRoot('SignIn', pageObject)
        .setPage('SignIn')
        .use({ actionType: 'emit', fn: pathSpy, trigger: 'path' })
        .use({ actionType: 'emit', fn: onClickSpy, trigger: 'onClick' })
    })

    it.only('should not erase DOM nodes from the page', async () => {
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
      let image = listItem?.child(1)
      noodluidom.parse(list)
      await waitFor(async () => {
        expect(document.getElementsByTagName('img')[0]).to.exist
        expect(document.getElementsByTagName('label')[0]).to.exist
        expect(document.getElementsByTagName('li')[0]).to.exist
        await image?.get('onClick')()
        expect(document.getElementsByTagName('img')[0]).to.exist
        // expect(document.getElementsByTagName('label')[0]).to.exist
        // expect(document.getElementsByTagName('li')[0]).to.exist
      })
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
