import { expect } from 'chai'
import sinon from 'sinon'
import createComponent from '../utils/createComponent'
import componentCache from '../utils/componentCache'
import isComponent from '../utils/isComponent'

let cache: ReturnType<typeof componentCache>

beforeEach(() => {
  cache = componentCache()
})

afterEach(() => {
  cache.clear()
})

describe(`componentCache`, () => {
  describe(`observers`, () => {
    describe(`clear`, () => {
      it(`should pass the expected args`, () => {
        const spy = sinon.spy()
        cache.on('clear', spy)
        const view = createComponent('view')
        const popUp = createComponent('popUp')
        view.createChild(popUp)
        cache.set(view)
        cache.set(popUp)
        cache.clear()
        const deletedComponents = spy.args[0][0]
        expect(spy).to.have.been.called
        expect(deletedComponents).to.have.property(view.id).eq(view)
        expect(deletedComponents).to.have.property(popUp.id).eq(popUp)
        expect(spy.args[0][1]).to.have.property('cache').eq(cache)
      })
    })
    describe(`set`, () => {
      it(`should pass the expected args`, () => {
        const spy = sinon.spy(cache, 'clear')
        cache.on('set', spy)
        const view = createComponent('view')
        cache.set(view)
        expect(spy).to.have.been.called
        expect(spy.args[0][0]).to.eq(view)
        expect(spy.args[0][1]).to.have.property('cache').eq(cache)
      })
    })
    describe(`remove`, () => {
      it(`should pass the expected args`, () => {
        const spy = sinon.spy()
        cache.on('set', spy)
        const view = createComponent('view')
        cache.set(view)
        cache.remove(view)
        expect(spy).to.have.been.called
        expect(isComponent(spy.args[0][0])).to.be.true
        expect(spy.args[0][1]).to.have.property('cache').eq(cache)
      })
    })
  })
})
