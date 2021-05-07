import sinon from 'sinon'
import chai, { expect } from 'chai'
import sinonChai from 'sinon-chai'
import { coolGold, italic } from 'noodl-common'
import * as u from './common-utils'

chai.use(sinonChai)

describe(coolGold(`common-utils`), () => {
  describe(`arrayEach`, () => {
    it(`should loop on a single value once if given a single value`, () => {
      const val = { fruits: ['apple', 'banana'] }
      u.arrayEach(val, (v) => expect(val).to.eq(v))
    })

    it(`should call the callback once if given a single value`, () => {
      const spy = sinon.spy()
      const val = { fruits: ['apple', 'banana'] }
      u.arrayEach(val, spy)
      expect(spy).to.be.calledOnce
    })

    it(`should loop once for each value like a regular forEach`, () => {
      const spy = sinon.spy()
      const val = [{ fruits: ['apple', 'banana'] }, {}, {}]
      u.arrayEach(val, spy)
      expect(spy).to.be.calledThrice
      expect(spy.firstCall.args[0]).to.eq(val[0])
      expect(spy.secondCall.args[0]).to.eq(val[1])
      expect(spy.thirdCall.args[0]).to.eq(val[2])
    })
  })

  describe(italic(`eachEntries`), () => {
    it(`should receive key as 1st arg and value as 2nd arg in each loop`, () => {
      const obj = { fruit: 'apple', vegetable: 'carrot' }
      u.eachEntries(obj, (key, val) => expect(obj[key]).to.eq(val))
    })
  })
})
