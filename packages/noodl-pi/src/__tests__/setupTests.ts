import chai from 'chai'
import sinonChai from 'sinon-chai'
import nock from 'nock'

chai.use(sinonChai)

beforeEach(() => {
  global.self = {
    addEventListener: () => {},
    // @ts-expect-error
    fetch: () => ({ json: () => {} }),
  }
})

afterEach(() => {
  nock.cleanAll()
})
