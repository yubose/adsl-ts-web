import _ from 'lodash'
import sinon from 'sinon'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import Logger, { _color } from './Logger'

chai.use(chaiAsPromised)

let logSpy: sinon.SinonStub

before(() => {
  console.clear()
  logSpy = sinon.stub(global.console, 'log')

  // Silence all the logging from our custom logger
  Logger.create = sinon.stub().callsFake(() =>
    _.reduce(
      _.keys(_color),
      (acc, color) => {
        acc[color] = _.noop
        return acc
      },
      {},
    ),
  )
})

after(() => {
  logSpy.restore()
})
