import { expect } from 'chai'
import { coolGold, italic } from 'noodl-common'
import sinon from 'sinon'
import createComponent from '../../utils/createComponent'
import ComponentCache from '../../cache/ComponentCache'
import { nui } from '../../utils/test-utils'

let componentCache: ComponentCache
let page = nui.createPage({ viewport: { width: 375, height: 667 } })

beforeEach(() => {
  componentCache = new ComponentCache()
})

afterEach(() => {
  componentCache.clear()
})

describe(coolGold(`ComponentCache`), () => {
  describe(italic(`emit`), () => {
    it(`should call the funcs subscribed to the "add" hook`, () => {
      const spy = sinon.spy()
      const spy2 = sinon.spy()
      componentCache.on('add', spy)
      componentCache.on('add', spy2)
      expect(spy).not.to.be.calledOnce
      expect(spy2).not.to.be.calledOnce
      componentCache.add({} as any, {} as any)
      expect(spy).to.be.calledOnce
      expect(spy2).to.be.calledOnce
    })

    it(`should call the funcs subscribed to the "clear" hook`, () => {
      const spy = sinon.spy()
      const spy2 = sinon.spy()
      componentCache.on('clear', spy)
      componentCache.on('clear', spy2)
      expect(spy).not.to.be.calledOnce
      expect(spy2).not.to.be.calledOnce
      const component = createComponent('button')
      const page = componentCache.add(component, {} as any)
      componentCache.add(component, {} as any)
      expect(spy).not.to.be.calledOnce
      expect(spy2).not.to.be.calledOnce
      componentCache.clear()
      expect(spy).to.be.calledOnce
      expect(spy2).to.be.calledOnce
    })

    it(`should call the funcs subscribed to the "remove" hook`, () => {
      const spy = sinon.spy()
      const spy2 = sinon.spy()
      componentCache.on('remove', spy)
      componentCache.on('remove', spy2)
      const component = createComponent('label')
      componentCache.add(component, {})
      expect(spy).not.to.be.calledOnce
      expect(spy2).not.to.be.calledOnce
      componentCache.remove(component)
      expect(spy).to.be.calledOnce
      expect(spy2).to.be.calledOnce
    })
  })

  describe(italic(`get`), () => {
    it(`should return the component instance if given the component instance`, () => {
      const component = createComponent('select')
      componentCache.add(component, {} as any)
      expect(componentCache.get(component).component).to.eq(component)
    })

    it(`should return the component instance if given the component id`, () => {
      const component = createComponent('select')
      componentCache.add(component, {} as any)
      expect(componentCache.get(component.id).component).to.eq(component)
    })

    it(`should return the whole component cache object if args is empty`, () => {
      console.info(componentCache)
      expect(componentCache.get()).to.be.instanceOf(Map)
    })
  })
})
