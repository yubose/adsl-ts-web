import * as mock from 'noodl-ui-test-utils'
import has from 'lodash/has'
import sinon from 'sinon'
import sample from 'lodash/sample'
import { isActionChain } from 'noodl-action-chain'
import { italic, magenta } from 'noodl-common'
import { userEvent } from 'noodl-types'
import { expect } from 'chai'
import { createDataKeyReference, nui } from '../utils/test-utils'
import { nuiEmitType, nuiEmitTransaction } from '../constants'
import Component from '../components/Base'
import Page from '../Page'
import store from '../store'

describe(italic(`createActionChain`), () => {
  it(`should create and return an ActionChain instance`, () => {
    expect(
      isActionChain(
        nui.createActionChain('onBlur', [mock.getDividerComponent()]),
      ),
    ).to.be.true
  })

  userEvent.forEach((evt) => {
    it(`should attach the ActionChain instance to ${magenta(evt)}`, () => {
      const ac = nui.createActionChain(
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
    const page = nui.createPage()
    nui.use({
      actionType: 'builtIn',
      fn: spy4,
      funcName: 'too',
      trigger: 'onFocus',
    })
    nui.use({ actionType: 'goto', fn: spy1, trigger: 'onFocus' })
    nui.use({ actionType: 'pageJump', fn: spy2, trigger: 'onFocus' })
    nui.use({ actionType: 'emit', fn: spy3, trigger: 'onFocus' })
    nui.use({ actionType: 'saveObject', fn: spy5, trigger: 'onFocus' })
    nui.use({ actionType: 'updateObject', fn: spy6, trigger: 'onFocus' })
    nui.use({ actionType: 'evalObject', fn: spy7, trigger: 'onFocus' })
    nui.use({ actionType: 'refresh', fn: spy8, trigger: 'onFocus' })
    const ac = nui.createActionChain(
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
        component: nui.resolveComponents({
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
    nui.use({
      actionType: 'builtIn',
      fn: spy1,
      funcName: 'kitty',
      trigger: 'onFocus',
    })
    nui.use({
      actionType: 'builtIn',
      fn: spy2,
      funcName: 'cereal',
      trigger: 'onFocus',
    })
    const page = nui.createPage()
    const ac = nui.createActionChain(
      'onHover',
      [
        mock.getBuiltInAction({ funcName: 'kitty' }),
        mock.getBuiltInAction({ funcName: 'cereal' }),
      ],
      {
        component: nui.resolveComponents({
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
      const page = nui.createPage()
      nui.use({
        actionType: 'builtIn',
        fn: spy4,
        funcName: 'too',
        trigger: 'onFocus',
      })
      nui.use({ actionType: 'goto', fn: spy1, trigger: 'onFocus' })
      nui.use({ actionType: 'pageJump', fn: spy2, trigger: 'onFocus' })
      nui.use({ actionType: 'emit', fn: spy3, trigger: 'onFocus' })
      nui.use({ actionType: 'saveObject', fn: spy5, trigger: 'onFocus' })
      nui.use({ actionType: 'updateObject', fn: spy6, trigger: 'onFocus' })
      nui.use({ actionType: 'evalObject', fn: spy7, trigger: 'onFocus' })
      nui.use({ actionType: 'refresh', fn: spy8, trigger: 'onFocus' })
      const ac = nui.createActionChain(
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
          component: nui.resolveComponents({
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
    const page = nui.createPage({
      name: 'Hello',
      viewport: { width: 375, height: 667 },
    })
    expect(page).to.be.instanceOf(Page)
    expect(nui.cache.page.has(page.id)).to.be.true
    expect(nui.cache.page.get(page.id).page).to.eq(page)
  })
})

describe(italic(`createSrc`), () => {
  describe(`when passing in a string`, () => {
    it(`should just return the url untouched if it starts with http`, () => {
      const url = `https://www.google.com/hello.jpeg`
      expect(nui.createSrc(url)).to.eq(url)
    })

    it(`should format and prepend the assetsUrl if it does not start with http`, () => {
      const path = `abc.jpeg`
      expect(nui.createSrc(path)).to.eq(nui.getAssetsUrl() + path)
    })
  })

  describe(`when passing in an emit object`, () => {
    it(`should format the string if it doesn't start with http`, () => {
      const path = 'too.jpg'
      const emit = { emit: { dataKey: { var1: 'abc' }, actions: [] } }
      nui.use({
        actionType: 'emit',
        fn: () => Promise.resolve(path),
        trigger: 'path',
      })
      return expect(nui.createSrc(emit)).to.eventually.eq(
        nui.getAssetsUrl() + path,
      )
    })

    it(`should resolve to the returned value from the promise if it starts with http`, () => {
      const path = 'https://www.google.com/too.jpg'
      const emit = { emit: { dataKey: { var1: 'abc' }, actions: [] } }
      nui.use({
        actionType: 'emit',
        fn: () => Promise.resolve(path),
        trigger: 'path',
      })
      return expect(nui.createSrc(emit)).to.eventually.eq(path)
    })

    it(`should be able to resolve emit paths from list consumers`, async () => {
      const path = { emit: { dataKey: { var1: 'cereal.fruit' }, actions: [] } }
      nui.use({
        actionType: 'emit',
        fn: () => Promise.resolve('halloween.jpg'),
        trigger: 'path',
      })
      const listObject = [{ fruit: 'apple.jpg' }, { fruit: 'orange.jpg' }]
      createDataKeyReference({ pageObject: { info: { people: listObject } } })
      const page = nui.createPage()
      const component = nui.resolveComponents({
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
      const expectedResult = nui.getAssetsUrl() + 'halloween.jpg'
      const src = await nui.createSrc(path, { component })
      expect(src).to.eq(expectedResult)
    })

    it(`should emit the "path" event after receiving the value from an emit object`, (done) => {
      const path = { emit: { dataKey: { var1: 'cereal.fruit' }, actions: [] } }
      nui.use({
        actionType: 'emit',
        fn: () => Promise.resolve('halloween.jpg'),
        trigger: 'path',
      })
      const listObject = [{ fruit: 'apple.jpg' }, { fruit: 'orange.jpg' }]
      createDataKeyReference({ pageObject: { info: { people: listObject } } })
      const page = nui.createPage()
      const component = nui.resolveComponents({
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
      image?.on('path', (s) => {
        const expectedResult = nui.getAssetsUrl() + 'halloween.jpg'
        expect(s).to.eq(expectedResult)
        expect(image.get('data-src')).to.eq(expectedResult)
        done()
      })
      nui.createSrc(path, { component })
    })
  })
})

describe(italic(`emit`), () => {
  describe(`type: ${magenta(nuiEmitType.REGISTER)}`, () => {
    it(`should throw if a callback was not provided`, () => {
      nui.use({
        register: { name: 'myRegister', page: '_global' },
      })
      return expect(
        nui.emit({
          type: 'register',
          args: { name: 'myRegister', page: '_global' } as any,
        }),
      ).to.eventually.be.rejectedWith(/callback is required/i)
    })

    it(`should pass the register object to the callback as args`, async () => {
      const spy = sinon.spy(() => Promise.resolve())
      nui.use({ register: { name: 'myRegister', page: '_global' } })
      await nui.emit({
        type: 'register',
        args: { name: 'myRegister', page: '_global', callback: spy },
      })
      expect(spy.args[0][0 as any]).to.eq(
        nui.cache.register.get('_global', 'myRegister'),
      )
    })
  })

  describe(`type: ${magenta(nuiEmitTransaction.REQUEST_PAGE_OBJECT)}`, () => {
    it(
      `should retrieve the callback in the transactions store using ` +
        `the provided transaction key`,
      async () => {
        const spy = sinon.spy(store, 'transactions', ['get'])
        const cbSpy = sinon.spy()
        nui.use({
          transaction: { transaction: 'hello', callback: cbSpy },
        })
        await nui.emit({ transaction: 'hello', type: 'transaction' } as any)
        expect(spy.get.calledOnce).to.be.true
        expect(cbSpy).to.be.calledOnce
      },
    )
  })
})

describe(italic(`getConsumerOptions`), () => {
  it(`should return the expected consumer options`, () => {
    const page = nui.createPage()
    const component = nui.resolveComponents({
      components: mock.getDividerComponent(),
      page,
    })
    const consumerOptions = nui.getConsumerOptions({ component, page })
    expect(consumerOptions).to.have.property('cache', nui.cache)
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
    const page = nui.createPage({ name: 'Hello' })
    expect(
      nui.resolveComponents({ page, components: mock.getDividerComponent() }),
    ).to.be.instanceOf(Component)
  })
})

describe.only(italic(`use`), () => {
  it(`should bind "this" to the main noodl-ui api`, () => {
    const spy = sinon.spy(nui, 'use_next')
    nui.use_next({} as any)
    expect(spy.thisValues[0]).to.eq(nui)
    spy.restore()
  })

  it(`should add an action using actionType as the key`, () => {
    const spy = sinon.spy()
    const obj = { actionType: 'evalObject', fn: spy } as any
    expect(has(nui.getActions(), 'evalObject')).to.be.true
    expect(nui.getActions().evalObject).not.to.have.length.greaterThan(0)
    nui.use_next(obj)
    expect(nui.getActions().evalObject).to.have.length.greaterThan(0)
    expect(nui.getActions().evalObject.find((o) => o.fn)).to.have.property(
      'fn',
      spy,
    )
  })

  it(
    `should throw if an action's actionType is "builtIn" and did not ` +
      `come with a "funcName"`,
    () => {
      expect(() => {
        nui.use_next({ actionType: 'builtIn', fn: sinon.spy() })
      }).to.throw(/funcName/i)
    },
  )

  it(`should add a builtIn using funcName as the key`, () => {
    const spy = sinon.spy()
    expect(has(nui.getBuiltIns(), 'hello')).to.be.false
    nui.use_next({ funcName: 'hello', fn: spy })
    expect(has(nui.getBuiltIns(), 'hello')).to.be.true
  })

  describe(`actions`, () => {
    it(`should accept { [actionType]: <function> }`, () => {
      const spy = sinon.spy()
      const obj = { popUp: spy } as any
      expect(nui.getActions().popUp).to.have.length(0)
      nui.use_next(obj)
      expect(nui.getActions().popUp).to.have.length.greaterThan(0)
      expect(nui.getActions().popUp[0]).to.have.property('fn', spy)
    })

    it(`should accept { [actionType]: <function>[] }`, () => {
      const spy = sinon.spy()
      const spy2 = sinon.spy()
      const obj = { popUp: [spy, spy2] } as any
      expect(nui.getActions().popUp).to.have.length(0)
      nui.use_next(obj)
      expect(nui.getActions().popUp).to.have.length(2)
      expect(nui.getActions().popUp.find((o) => o.fn === spy)).to.have.property(
        'fn',
        spy,
      )
      expect(
        nui.getActions().popUp.find((o) => o.fn === spy2),
      ).to.have.property('fn', spy2)
    })

    it(`should accept { [actionType]: { fn: <function> } }`, () => {
      const spy = sinon.spy()
      const obj = { popUp: { fn: spy } } as any
      expect(nui.getActions().popUp).to.have.length(0)
      nui.use_next(obj)
      expect(nui.getActions().popUp).to.have.length(1)
      expect(nui.getActions().popUp.find((o) => o.fn === spy)).to.have.property(
        'fn',
        spy,
      )
    })

    it(`should accept { [actionType]: { fn: <function> }[] }`, () => {
      const spy = sinon.spy()
      const obj = { popUp: [{ fn: spy }] } as any
      expect(nui.getActions().popUp).to.have.length(0)
      nui.use_next(obj)
      expect(nui.getActions().popUp).to.have.length(1)
      expect(nui.getActions().popUp.find((o) => o.fn === spy)).to.have.property(
        'fn',
        spy,
      )
    })
  })

  describe(`builtIns`, () => {
    xit(``, () => {
      //
    })
  })

  describe(`plugins`, () => {
    xit(``, () => {
      //
    })
  })

  it(`should use the getAssetsUrl provided function`, () => {
    expect(nui.getAssetsUrl()).not.to.eq('fafasfs')
    nui.use({ getAssetsUrl: () => 'fafasfs' })
    expect(nui.getAssetsUrl()).to.eq('fafasfs')
  })

  it(`should use the getBaseUrl provided function`, () => {
    expect(nui.getBaseUrl()).not.to.eq('fafasfs')
    nui.use({ getBaseUrl: () => 'fafasfs' })
    expect(nui.getBaseUrl()).to.eq('fafasfs')
  })

  it(`should use the getPages provided function`, () => {
    expect(nui.getPages()).not.to.eq(['fapple'])
    expect(nui.getPages()).not.to.eq('abc')
    nui.use({ getPages: () => ['apple'] })
    expect(nui.getPages()).to.deep.eq(['apple'])
  })

  it(`should use the getPreloadPages provided function`, () => {
    expect(nui.getPreloadPages()).not.to.eq(['fapple'])
    expect(nui.getPreloadPages()).not.to.eq('abc')
    nui.use({ getPreloadPages: () => ['apple'] })
    expect(nui.getPreloadPages()).to.deep.eq(['apple'])
  })

  it(`should use the getRoot provided function`, () => {
    expect(nui.getRoot()).not.to.eq(['fapple'])
    expect(nui.getRoot()).not.to.eq('abc')
    nui.use({ getRoot: () => ['apple'] })
    expect(nui.getRoot()).to.deep.eq(['apple'])
  })

  describe(`register`, () => {
    it(`should throw if it cannot locate a name or identifier`, () => {
      expect(() => {
        nui.use({ register: { component: {} as any, page: '_global' } })
      }).to.throw(/could not locate/i)
    })

    it(`should add to the register store`, () => {
      expect(nui.cache.register.has('_global', 'hello')).to.be.false
      nui.use({ register: { name: 'hello', page: '_global' } })
      expect(nui.cache.register.has('_global', 'hello')).to.be.true
    })

    it(`should default the page to "_global" if it is not provided`, () => {
      expect(nui.cache.register.has('_global', 'hello')).to.be.false
      nui.use({ register: { name: 'hello' } as any })
      expect(nui.cache.register.has('_global', 'hello')).to.be.true
    })
  })
})
