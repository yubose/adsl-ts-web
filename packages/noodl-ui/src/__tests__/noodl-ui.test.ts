import * as mock from 'noodl-ui-test-utils'
import sinon from 'sinon'
import sample from 'lodash/sample'
import { isActionChain } from 'noodl-action-chain'
import { italic, magenta } from 'noodl-common'
import { userEvent } from 'noodl-types'
import { expect } from 'chai'
import Component from '../components/Base'
import Page from '../Page'
import NUI from '../noodl-ui'
import { createDataKeyReference } from '../utils/test-utils'

describe(italic(`createActionChain`), () => {
  it(`should create and return an ActionChain instance`, () => {
    expect(
      isActionChain(
        NUI.createActionChain('onBlur', [mock.getDividerComponent()]),
      ),
    ).to.be.true
  })

  userEvent.forEach((evt) => {
    it(`should attach the ActionChain instance to ${magenta(evt)}`, () => {
      const ac = NUI.createActionChain(
        'onClick',
        mock.getVideoComponent({
          [sample(userEvent) as any]: [mock.getPopUpAction()],
        }),
      )
      expect(isActionChain(ac)).to.be.true
    })
  })

  it(`should attach the action handlers from the store `, async () => {
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()
    const spy3 = sinon.spy()
    const spy4 = sinon.spy()
    const spy5 = sinon.spy()
    const spy6 = sinon.spy()
    const spy7 = sinon.spy()
    const spy8 = sinon.spy()
    const spies = [spy1, spy2, spy3, spy4, spy5, spy6, spy7, spy8]
    const page = NUI.createPage()
    NUI.use({
      actionType: 'builtIn',
      fn: spy4,
      funcName: 'too',
      trigger: 'onFocus',
    })
    NUI.use({ actionType: 'goto', fn: spy1, trigger: 'onFocus' })
    NUI.use({ actionType: 'pageJump', fn: spy2, trigger: 'onFocus' })
    NUI.use({ actionType: 'emit', fn: spy3, trigger: 'onFocus' })
    NUI.use({ actionType: 'saveObject', fn: spy5, trigger: 'onFocus' })
    NUI.use({ actionType: 'updateObject', fn: spy6, trigger: 'onFocus' })
    NUI.use({ actionType: 'evalObject', fn: spy7, trigger: 'onFocus' })
    NUI.use({ actionType: 'refresh', fn: spy8, trigger: 'onFocus' })
    const ac = NUI.createActionChain(
      'onFocus',
      [
        mock.getPageJumpAction(),
        mock.getEmitObject(),
        mock.getGotoObject(),
        mock.getBuiltInAction({ funcName: 'too' }),
        mock.getRefreshAction(),
        mock.getSaveObjectAction(),
        mock.getUpdateObjectAction(),
        mock.getEvalObjectAction(),
      ],
      {
        component: NUI.resolveComponents({
          components: mock.getViewComponent(),
          page,
        }),
        loadQueue: true,
        page,
      },
    )
    await ac.execute()
    spies.forEach((s) => expect(s).to.be.calledOnce)
  })

  it(`should attach builtIn action handlers from the store`, async () => {
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()
    NUI.use({
      actionType: 'builtIn',
      fn: spy1,
      funcName: 'kitty',
      trigger: 'onFocus',
    })
    NUI.use({
      actionType: 'builtIn',
      fn: spy2,
      funcName: 'cereal',
      trigger: 'onFocus',
    })
    const page = NUI.createPage()
    const ac = NUI.createActionChain(
      'onHover',
      [
        mock.getBuiltInAction({ funcName: 'kitty' }),
        mock.getBuiltInAction({ funcName: 'cereal' }),
      ],
      {
        component: NUI.resolveComponents({
          components: mock.getLabelComponent(),
          page,
        }),
        loadQueue: true,
        page,
      },
    )
    await ac.execute()
    expect(spy1).to.be.calledOnce
    expect(spy2).to.be.calledOnce
  })

  it(
    `should be able to re-load the action handlers/builtIn action ` +
      `handlers from the store when action chains refresh`,
    async () => {
      const spy1 = sinon.spy()
      const spy2 = sinon.spy()
      const spy3 = sinon.spy()
      const spy4 = sinon.spy()
      const spy5 = sinon.spy()
      const spy6 = sinon.spy()
      const spy7 = sinon.spy()
      const spy8 = sinon.spy()
      const spies = [spy1, spy2, spy3, spy4, spy5, spy6, spy7, spy8]
      const page = NUI.createPage()
      NUI.use({
        actionType: 'builtIn',
        fn: spy4,
        funcName: 'too',
        trigger: 'onFocus',
      })
      NUI.use({ actionType: 'goto', fn: spy1, trigger: 'onFocus' })
      NUI.use({ actionType: 'pageJump', fn: spy2, trigger: 'onFocus' })
      NUI.use({ actionType: 'emit', fn: spy3, trigger: 'onFocus' })
      NUI.use({ actionType: 'saveObject', fn: spy5, trigger: 'onFocus' })
      NUI.use({ actionType: 'updateObject', fn: spy6, trigger: 'onFocus' })
      NUI.use({ actionType: 'evalObject', fn: spy7, trigger: 'onFocus' })
      NUI.use({ actionType: 'refresh', fn: spy8, trigger: 'onFocus' })
      const ac = NUI.createActionChain(
        'onFocus',
        [
          mock.getPageJumpAction(),
          mock.getEmitObject(),
          mock.getGotoObject(),
          mock.getBuiltInAction({ funcName: 'too' }),
          mock.getRefreshAction(),
          mock.getSaveObjectAction(),
          mock.getUpdateObjectAction(),
          mock.getEvalObjectAction(),
        ],
        {
          component: NUI.resolveComponents({
            components: mock.getViewComponent(),
            page,
          }),
          loadQueue: true,
          page,
        },
      )
      await ac.execute()
      spies.forEach((s) => expect(s).to.be.calledOnce)
      await ac.execute()
      spies.forEach((s) => expect(s).to.be.calledTwice)
    },
  )
})

describe(italic(`createPage`), () => {
  it(`should create and return a new Page instance from the PageCache`, () => {
    const page = NUI.createPage({
      name: 'Hello',
      viewport: { width: 375, height: 667 },
    })
    console.info(NUI.cache.page.get(page.id))
    expect(page).to.be.instanceOf(Page)
    expect(NUI.cache.page.has(page.id)).to.be.true
    expect(NUI.cache.page.get(page.id).page).to.eq(page)
  })
})

describe.only(italic(`createSrc`), () => {
  describe(`when passing in a string`, () => {
    it(`should just return the url untouched if it starts with http`, () => {
      const url = `https://www.google.com/hello.jpeg`
      expect(NUI.createSrc(url)).to.eq(url)
    })

    it(`should format and prepend the assetsUrl if it does not start with http`, () => {
      const path = `abc.jpeg`
      expect(NUI.createSrc(path)).to.eq(NUI.getAssetsUrl() + path)
    })
  })

  describe(`when passing in an emit object`, () => {
    it(`should format the string if it doesn't start with http`, () => {
      const path = 'too.jpg'
      const emit = { emit: { dataKey: { var1: 'abc' }, actions: [] } }
      NUI.use({
        actionType: 'emit',
        fn: () => Promise.resolve(path),
        trigger: 'path',
      })
      return expect(NUI.createSrc(emit)).to.eventually.eq(
        NUI.getAssetsUrl() + path,
      )
    })

    it(`should resolve to the returned value from the promise if it starts with http`, () => {
      const path = 'https://www.google.com/too.jpg'
      const emit = { emit: { dataKey: { var1: 'abc' }, actions: [] } }
      NUI.use({
        actionType: 'emit',
        fn: () => Promise.resolve(path),
        trigger: 'path',
      })
      return expect(NUI.createSrc(emit)).to.eventually.eq(path)
    })

    it(`should be able to resolve emit paths from list consumers`, async () => {
      const path = { emit: { dataKey: { var1: 'cereal.fruit' }, actions: [] } }
      NUI.use({
        actionType: 'emit',
        fn: () => Promise.resolve('halloween.jpg'),
        trigger: 'path',
      })
      const listObject = [{ fruit: 'apple.jpg' }, { fruit: 'orange.jpg' }]
      createDataKeyReference({ pageObject: { info: { people: listObject } } })
      const page = NUI.createPage()
      const component = NUI.resolveComponents({
        components: mock.getListComponent({
          contentType: 'listObject',
          listObject,
          iteratorVar: 'cereal',
          children: [
            mock.getListItemComponent({
              cereal: '',
              children: [mock.getImageComponent({ path })],
            }),
          ],
        }),
        page,
      })
      const expectedResult = NUI.getAssetsUrl() + 'halloween.jpg'
      const src = await NUI.createSrc(path, { component })
      expect(src).to.eq(expectedResult)
    })

    it(`should emit the "path" event after receiving the value from an emit object`, (done) => {
      const path = { emit: { dataKey: { var1: 'cereal.fruit' }, actions: [] } }
      NUI.use({
        actionType: 'emit',
        fn: () => Promise.resolve('halloween.jpg'),
        trigger: 'path',
      })
      const listObject = [{ fruit: 'apple.jpg' }, { fruit: 'orange.jpg' }]
      createDataKeyReference({ pageObject: { info: { people: listObject } } })
      const page = NUI.createPage()
      const component = NUI.resolveComponents({
        components: mock.getListComponent({
          contentType: 'listObject',
          listObject,
          iteratorVar: 'cereal',
          children: [
            mock.getListItemComponent({
              cereal: '',
              children: [mock.getImageComponent({ path })],
            }),
          ],
        }),
        page,
      })
      const image = component.child().child()
      image.on('path', (s) => {
        const expectedResult = NUI.getAssetsUrl() + 'halloween.jpg'
        expect(s).to.eq(expectedResult)
        expect(image.get('data-src')).to.eq(expectedResult)
        done()
      })
      NUI.createSrc(path, { component })
    })
  })
})

describe(italic(`getConsumerOptions`), () => {
  it(`should return the expected consumer options`, () => {
    const page = NUI.createPage()
    const component = NUI.resolveComponents({
      components: mock.getDividerComponent(),
      page,
    })
    const consumerOptions = NUI.getConsumerOptions({ component, page })
    expect(consumerOptions).to.have.property('cache', NUI.cache)
    expect(consumerOptions).to.have.property('component', component)
    expect(consumerOptions).to.have.property('context')
    expect(consumerOptions).to.have.property('createActionChain')
    expect(consumerOptions).to.have.property('createPage')
    expect(consumerOptions).to.have.property('getAssetsUrl')
    expect(consumerOptions).to.have.property('getActions')
    expect(consumerOptions).to.have.property('getBuiltIns')
    expect(consumerOptions).to.have.property('getBaseUrl')
    expect(consumerOptions).to.have.property('getBaseStyles')
    expect(consumerOptions).to.have.property('getPlugins')
    expect(consumerOptions).to.have.property('getPages')
    expect(consumerOptions).to.have.property('getPreloadPages')
    expect(consumerOptions).to.have.property('getQueryObjects')
    expect(consumerOptions).to.have.property('getRoot')
    expect(consumerOptions).to.have.property('getRootPage')
    expect(consumerOptions).to.have.property('page', page)
    expect(consumerOptions).to.have.property('resolveComponents')
    expect(consumerOptions).to.have.property('viewport', page.viewport)
  })
})

describe(italic(`resolveComponents`), () => {
  it(`should return component instances`, () => {
    const page = NUI.createPage('Hello')
    expect(
      NUI.resolveComponents({ page, components: mock.getDividerComponent() }),
    ).to.be.instanceOf(Component)
  })
})

describe(italic(`use`), () => {
  it(`should use the getAssetsUrl provided function`, () => {
    expect(NUI.getAssetsUrl()).not.to.eq('fafasfs')
    NUI.use({ getAssetsUrl: () => 'fafasfs' })
    expect(NUI.getAssetsUrl()).to.eq('fafasfs')
  })

  it(`should use the getBaseUrl provided function`, () => {
    expect(NUI.getBaseUrl()).not.to.eq('fafasfs')
    NUI.use({ getBaseUrl: () => 'fafasfs' })
    expect(NUI.getBaseUrl()).to.eq('fafasfs')
  })

  it(`should use the getPages provided function`, () => {
    expect(NUI.getPages()).not.to.eq(['fapple'])
    expect(NUI.getPages()).not.to.eq('abc')
    NUI.use({ getPages: () => ['apple'] })
    expect(NUI.getPages()).to.deep.eq(['apple'])
  })

  it(`should use the getPreloadPages provided function`, () => {
    expect(NUI.getPreloadPages()).not.to.eq(['fapple'])
    expect(NUI.getPreloadPages()).not.to.eq('abc')
    NUI.use({ getPreloadPages: () => ['apple'] })
    expect(NUI.getPreloadPages()).to.deep.eq(['apple'])
  })

  it(`should use the getRoot provided function`, () => {
    expect(NUI.getRoot()).not.to.eq(['fapple'])
    expect(NUI.getRoot()).not.to.eq('abc')
    NUI.use({ getRoot: () => ['apple'] })
    expect(NUI.getRoot()).to.deep.eq(['apple'])
  })
})
