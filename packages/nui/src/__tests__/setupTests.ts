import JSDOM from 'jsdom-global'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chai from 'chai'

JSDOM('', {
  resources: 'usable',
  runScripts: 'dangerously',
})

chai.use(sinonChai)

let logSpy: sinon.SinonStub
let invariantStub: sinon.SinonStub

let defaultPage = 'Hello'
let defaultPageObject = { formData: { password: 'abc123' } }
let defaultRoot = { [defaultPage]: defaultPageObject }

before(() => {
  // process.stdout.write('\x1Bc')
})

beforeEach(() => {
  // Nui.createPage({ name: defaultPage, viewport: { width: 375, height: 667 } })
  // Nui.use({
  //   getAssetsUrl: () => assetsUrl,
  //   getBaseUrl: () => 'https://google.com/',
  //   getRoot: () => ({ ...defaultRoot }),
  //   getPreloadPages: () => [],
  //   getPages: () => [defaultPage],
  // })
})

afterEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  console.log(document)
  // Nui.reset()
})
