import { expect } from 'chai'
import Timers from '../../modules/Timers'
import Timer from '../../modules/Timer'

describe('Timers', () => {
  describe('set', () => {
    it(`should create a new timer instance to the store and return the instance`, () => {
      const page = 'SignIn'
      const timers = new Timers()
      const timer = timers.set('SignIn', {
        dataKey: `${page}.counter`,
        value: 0,
      })
      expect(timer).to.be.instanceOf(Timer)
      expect(timers.store.has(page)).to.be.true
    })

    it(`should not make a new timer instance if there is already an existing one`, () => {
      const page = 'SignIn'
      const timers = new Timers()
      const timer = timers.set('SignIn', {
        dataKey: `${page}.counter`,
        value: 0,
      })
      timers.set(page, { value: 500 })
      expect(timers.get(page)).to.eq(timer)
      expect(timers.get(page)).to.have.property('value', 500)
    })
  })

  describe('create', () => {
    it(
      `should create a new timer instance to the store (overwrites existing ` +
        `reference) and return it`,
      () => {
        const page = 'SignIn'
        const timers = new Timers()
        const timer = timers.set(page, {
          dataKey: `${page}.counter`,
          value: 0,
        })
        timers.create({ page, value: 500 })
        expect(timers.get(page)).not.to.eq(timer)
        expect(timers.get(page)).to.have.property('value', 500)
      },
    )
  })
})
