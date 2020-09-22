import sinon from 'sinon'

let logSpy: sinon.SinonStub

before(async () => {
  logSpy = sinon.stub(global.console, 'log')
})

after(() => {
  logSpy.restore()
})
