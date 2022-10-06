import { expect } from 'chai'
import sinon from 'sinon'
import Timer from '../../modules/Timer'

describe('Timer', () => {
  describe('Instantiation', () => {
    it(`should throw if page isn't provided`, () => {
      expect(() => {
        new Timer({ dataKey: 'hello' } as any)
      }).to.throw(/page/i)
    })

    it(`should initiate the value to the provided value if provided`, () => {
      const timer = new Timer({ page: 'S', value: 500 })
      expect(timer.value).to.eq(500)
    })
  })

  describe('start', () => {
    it(`should set the setInterval ref on the instance`, () => {
      const timer = new Timer({ page: 'Hello', dataKey: 'hello' })
      expect(timer.ref).to.be.null
      timer.start()
      expect(timer.ref).not.to.be.null
      timer.clear()
    })
  })

  describe('stop', () => {
    it(`should clear the interval and set the setInterval ref to null`, () => {
      const timer = new Timer({ page: 'Hello', dataKey: 'hello' })
      timer.start()
      expect(timer.ref).not.to.be.null
      timer.clear()
      expect(timer.ref).to.be.null
    })
  })

  describe('increment', () => {
    it(`should call the increment func and update the value if it expects it to be`, () => {
      const timer = new Timer({
        page: 'Hello',
        dataKey: 'hello',
        value: 0,
        increment: () => {
          timer.value++
        },
      })
      expect(timer.value).to.eq(0)
      timer.increment()
      expect(timer.value).to.eq(1)
      timer.increment()
      timer.increment()
      expect(timer.value).to.eq(3)
      timer.clear()
    })
  })

  describe('clear', () => {
    it(`should clear the interval and the ref reference`, () => {
      const timer = new Timer({ page: 'Hello', dataKey: 'hello' })
      const spy = sinon.spy(timer, 'clear')
      timer.start()
      expect(timer.ref).not.to.be.null
      expect(spy).not.to.be.called
      timer.clear()
      expect(spy).to.be.calledOnce
      expect(timer.ref).to.be.null
      spy.restore()
    })

    it(`should not change or reset its value`, () => {
      const timer = new Timer({ page: 'Hello', dataKey: 'hello', value: 100 })
      timer.increment = () => timer.value++
      const spy = sinon.spy(timer, 'clear')
      timer.start()
      timer.increment()
      timer.increment()
      timer.increment()
      timer.increment()
      const currentValue = timer.value
      expect(currentValue).to.exist
      timer.clear()
      expect(spy).to.be.calledOnce
      expect(timer.ref).to.be.null
      expect(timer.value).to.eq(currentValue)
      expect(timer.value).to.exist
      spy.restore()
    })
  })

  describe('Observers', () => {
    it(`should call onStart when start() was called`, () => {
      const spy = sinon.spy()
      const timer = new Timer({
        page: 'Hello',
        dataKey: 'hello',
        value: 100,
        onStart: spy,
      })
      expect(spy).not.to.be.called
      timer.start()
      expect(spy).to.be.called
      timer.clear()
    })

    it(`should call onStop when stop() was called`, () => {
      const spy = sinon.spy()
      const timer = new Timer({
        page: 'Hello',
        dataKey: 'hello',
        value: 100,
        onStop: spy,
      })
      expect(spy).not.to.be.called
      timer.stop()
      expect(spy).to.be.called
    })

    it(`should call onClear when clear() was called`, () => {
      const spy = sinon.spy()
      const timer = new Timer({
        page: 'Hello',
        dataKey: 'hello',
        value: 100,
        onClear: spy,
      })
      expect(spy).not.to.be.called
      timer.clear()
      expect(spy).to.be.called
    })
  })
})
