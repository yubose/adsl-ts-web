import sinon from 'sinon'
import Logger, { _color } from './Logger'

let logSpy: sinon.SinonStub

before(async () => {
  console.clear()
  // Silence all the logging from our custom logger
  Logger.create = sinon.stub().callsFake(() =>
    Object.keys(_color).reduce((acc: any, color) => {
      acc[color] = () => () => {}
      return acc
    }, {}),
  )

  logSpy = sinon.stub(global.console, 'log')
})

after(() => {
  logSpy.restore()
})

afterEach(() => {
  document.body.textContent = ''
})
