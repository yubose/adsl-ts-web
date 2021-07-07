import sinon from 'sinon'
import { expect } from 'chai'
import { coolGold, italic } from 'noodl-common'
import * as mock from 'noodl-ui-test-utils'
import * as n from '../utils/noodl'
import { createDataKeyReference } from '../utils/test-utils'
import NUI from '../noodl-ui'

/** REMINDER: Total components created should be 9 for this func */
const getResolvedListComponentPreset = () =>
  NUI.resolveComponents(
    mock.getListComponent({
      iteratorVar: 'iceCream',
      listObject: [{ key: 'Gender', value: 'Male' }],
      children: [
        mock.getListItemComponent({
          children: [
            mock.getViewComponent({
              children: [
                mock.getSelectComponent(),
                mock.getButtonComponent(),
                mock.getTextFieldComponent(),
                mock.getViewComponent({ children: [] }),
                mock.getViewComponent({ children: [mock.getLabelComponent()] }),
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

  describe(italic(`findIteratorVar`), () => {
    it(`should get the iteratorVar if its a list`, () => {
      const list = NUI.resolveComponents(
        mock.getListComponent({ iteratorVar: 'hello' }),
      )
      expect(n.findIteratorVar(list)).to.eq('hello')
    })

    it(`should get the iteratorVar if its a listItem`, () => {
      const list = NUI.resolveComponents(
        mock.getListComponent({ iteratorVar: 'trap' }),
      )
      const listItem = list.child()
      expect(n.findIteratorVar(listItem)).to.eq('trap')
    })

    it(`should get the iteratorVar if its a deeply nested descendant`, () => {
      const list = NUI.resolveComponents(
        mock.getListComponent({
          iteratorVar: 'iceCream',
          children: [
            mock.getListItemComponent({
              children: [
                mock.getViewComponent({
                  children: [mock.getButtonComponent()],
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
    it(`should flatten into an array of all the components`, () => {
      expect(n.flatten(getResolvedListComponentPreset())).to.have.lengthOf(9)
    })
  })

  describe(italic(`findChild`), () => {
    it(`should call the callback on all children including the last one if none of the conditions are passing`, () => {
      const spy = sinon.spy()
      n.findChild(getResolvedListComponentPreset(), spy)
      expect(spy).to.have.callCount(8)
    })
  })

  xdescribe(italic(`findParent`), () => {
    it(
      `should call the callback on all parents including the last one ` +
        `if none of the conditions are passing`,
      () => {
        const spy = sinon.spy()
        n.findParent(getResolvedListComponentPreset(), spy)
        expect(spy).to.have.callCount(8)
      },
    )
  })

  xdescribe(italic(`getRootParent`), () => {
    it(`should return the root ancestor`, () => {
      const list = getResolvedListComponentPreset()
      const lastChild = n.getLast(list) as any
      // expect(n.getRootParent(lastChild)).to.eq(list)
      // console.info()
      n.getRootParent(lastChild)
    })
  })

  describe(italic(`getLast`), () => {
    it(`should return the last component in its tree hierarchy`, () => {
      const list = getResolvedListComponentPreset()
      const lastChild = list.child().child().child(4).child()
      expect(n.getLast(list)).to.eq(lastChild)
    })
  })

  describe(italic(`isListConsumer`), () => {
    it(`should return true for list components`, () => {
      expect(n.isListConsumer(NUI.resolveComponents(mock.getListComponent())))
        .to.be.true
    })

    it(`should return true for listItem components`, () => {
      expect(
        n.isListConsumer(
          NUI.resolveComponents(mock.getListComponent()).child(),
        ),
      ).to.be.true
    })

    it(`should return true for deeply nested descendants of a list`, () => {
      expect(
        n.isListConsumer(
          NUI.resolveComponents(getResolvedListComponentPreset())
            .child()
            .child()
            .child(4)
            .child(),
        ),
      ).to.be.true
    })
  })

  describe(italic(`isListLike`), () => {
    it(`should return true for list components`, () => {
      expect(n.isListLike(NUI.resolveComponents(mock.getListComponent()))).to.be
        .true
    })

    it(`should return true for chatList components`, () => {
      expect(n.isListLike(NUI.resolveComponents({ type: 'chatList' }))).to.be
        .true
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
    it(`should call the callback on every child including the last one`, () => {
      const spy = sinon.spy()
      n.publish(getResolvedListComponentPreset(), spy)
      expect(spy).to.have.callCount(8)
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

    it.only(
      `should return the correct url using the list item ` + `iteratorVar way`,
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
