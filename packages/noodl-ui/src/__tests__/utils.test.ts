import sinon from 'sinon'
import { expect } from 'chai'
import { waitFor } from '@testing-library/dom'
import { coolGold, italic } from 'noodl-common'
import * as n from '../utils/noodl'
import { createDataKeyReference, ui } from '../utils/test-utils'
import NUI from '../noodl-ui'

/** REMINDER: Total components created should be 9 for this func */
const getResolvedListComponentPreset = async () =>
  NUI.resolveComponents(
    ui.list({
      contentType: 'listObject',
      iteratorVar: 'iceCream',
      listObject: [{ key: 'Gender', value: 'Male' }],
      children: [
        ui.listItem({
          iceCream: '',
          children: [
            ui.view({
              children: [
                ui.select([]),
                ui.button(),
                ui.textField(),
                ui.view({ children: [] }),
                ui.view({ children: [ui.label()] }),
              ],
            }),
          ],
        }),
      ],
    }),
  )

describe(coolGold(`Utils`), () => {
  beforeEach(() => {
    createDataKeyReference({
      pageName: 'Cat',
    })
  })

  describe(italic(`findIteratorVar`), async () => {
    it(`should get the iteratorVar if its a list`, async () => {
      const list = await NUI.resolveComponents(
        ui.list({ iteratorVar: 'hello' }),
      )
      expect(n.findIteratorVar(list)).to.eq('hello')
    })

    it(`should get the iteratorVar if its a listItem`, async () => {
      const list = await NUI.resolveComponents(ui.list({ iteratorVar: 'trap' }))
      const listItem = list.child()
      expect(n.findIteratorVar(listItem)).to.eq('trap')
    })

    it(`should get the iteratorVar if its a deeply nested descendant`, async () => {
      const list = await NUI.resolveComponents(
        ui.list({
          iteratorVar: 'iceCream',
          children: [
            ui.listItem({
              children: [
                ui.view({
                  children: [ui.button],
                }),
              ],
            }),
          ],
        }),
      )
      const button = list.child().child().child()
      expect(n.findIteratorVar(button)).to.eq('iceCream')
    })
  })

  describe(italic(`flatten`), () => {
    it(`should flatten into an array of all the components`, async () => {
      const resolved = await getResolvedListComponentPreset()
      await waitFor(async () => {
        expect(n.flatten(resolved)).to.have.lengthOf(9)
      })
    })
  })

  describe(italic(`findChild`), () => {
    it(`should call the callback on all children including the last one if none of the conditions are passing`, async () => {
      const spy = sinon.spy()
      n.findChild(await getResolvedListComponentPreset(), spy)
      expect(spy).to.have.callCount(8)
    })
  })

  xdescribe(italic(`findParent`), async () => {
    it(
      `should call the callback on all parents including the last one ` +
        `if none of the conditions are passing`,
      async () => {
        const spy = sinon.spy()
        n.findParent(await getResolvedListComponentPreset(), spy)
        expect(spy).to.have.callCount(8)
      },
    )
  })

  xdescribe(italic(`getRootParent`), () => {
    it(`should return the root ancestor`, async () => {
      const list = await getResolvedListComponentPreset()
      const lastChild = n.getLast(list) as any
      // expect(n.getRootParent(lastChild)).to.eq(list)
      // console.info()
      n.getRootParent(lastChild)
    })
  })

  describe(italic(`getLast`), () => {
    it(`should return the last component in its tree hierarchy`, async () => {
      const list = await getResolvedListComponentPreset()
      await waitFor(() => {
        const lastChild = list.child().child().child(4).child()
        expect(n.getLast(list)).to.eq(lastChild)
      })
    })
  })

  describe(italic(`isListConsumer`), () => {
    it(`should return true for list components`, async () => {
      expect(n.isListConsumer(await NUI.resolveComponents(ui.list()))).to.be
        .true
    })

    it(`should return true for listItem components`, async () => {
      expect(n.isListConsumer((await NUI.resolveComponents(ui.list())).child()))
        .to.be.true
    })

    xit(`should return true for deeply nested descendants of a list`, async () => {
      const preset = await getResolvedListComponentPreset()
      expect(
        n.isListConsumer(
          (await NUI.resolveComponents(preset))
            .child()
            .child()
            .child(4)
            .child(),
        ),
      ).to.be.true
    })
  })

  describe(italic(`isListLike`), () => {
    it(`should return true for list components`, async () => {
      expect(
        n.isListLike(
          await NUI.resolveComponents(
            ui.list({
              contentType: 'listObject',
              iteratorVar: 'itemObject',
              children: [ui.listItem({ itemObject: '' })],
            }),
          ),
        ),
      ).to.be.true
    })

    it(`should return true for chatList components`, async () => {
      expect(n.isListLike(await NUI.resolveComponents({ type: 'chatList' }))).to
        .be.true
    })
  })

  describe(italic(`parseReference`), () => {
    xit(`should be able to parse a local reference`, () => {
      //
    })

    xit(`should be able to parse a root reference`, () => {
      //
    })

    xit(`should be able to parse a data object from a listObject reference`, () => {
      //
    })
  })

  describe(italic(`publish`), () => {
    it(`should call the callback on every child including the last one`, async () => {
      const spy = sinon.spy()
      const components = await getResolvedListComponentPreset()
      n.publish(components, spy)
      await waitFor(() => expect(spy).to.have.callCount(8))
    })
  })
})

describe(italic(`resolveAssetUrl`), () => {
  describe(`when resolving through list item data objects`, () => {
    const assetsUrl = 'https://aitmed.com/abc/assets/'
    const iteratorVar = 'imagePath'
    const imagePath = 'pigBlack.png'
    const src = `${assetsUrl}${imagePath}`
    const dataObject = {
      imagePath,
      imgName: 'Free',
      number: 1,
    }

    it(
      `should return the correct url using the list item ` + `iteratorVar`,
      () => {
        expect(
          n.resolveAssetUrl(src, { assetsUrl, dataObject, iteratorVar }),
        ).to.eq(`${assetsUrl}${imagePath}`)
      },
    )
  })

  it(`should return true`, () => {
    expect(n.resolveAssetUrl('abc.png', NUI.getAssetsUrl())).to.eq(
      `${NUI.getAssetsUrl()}abc.png`,
    )
  })
})
