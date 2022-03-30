import chai from 'chai'
import sinonChai from 'sinon-chai'
import nock from 'nock'

chai.use(sinonChai)

beforeEach(() => {
  global.self = {
    addEventListener: () => {},
  }
})

afterEach(() => {
  nock.cleanAll()
})
