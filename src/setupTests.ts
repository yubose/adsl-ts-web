import _ from 'lodash'
import sinon from 'sinon'

let logSpy: sinon.SinonStub

before(() => {
  logSpy = sinon.stub(global.console, 'log')
})

after(() => {
  logSpy.restore()
})
