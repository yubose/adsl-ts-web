import _ from 'lodash'
import sinon from 'sinon'
import Logger, { _color } from './app/Logger'

let logSpy: sinon.SinonStub

before(async () => {
  console.clear()
  // Silence all the logging from our custom logger
  Logger.create = sinon.stub().callsFake(() =>
    _.reduce(
      _.keys(_color),
      (acc: any, color) => {
        acc[color] = _.noop
        return acc
      },
      {},
    ),
  )

  logSpy = sinon.stub(global.console, 'log')
})

after(() => {
  logSpy.restore()
})

afterEach(() => {
  document.body.textContent = ''
})
