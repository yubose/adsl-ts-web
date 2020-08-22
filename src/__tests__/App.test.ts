import { expect } from 'chai'
import { App } from '../App'

let app: App

beforeEach(() => {
  app = new App()
})

describe('App', () => {
  it('what about me?', () => {
    //
  })

  it('should initialize the store on initialization', () => {
    expect(app.getStore).to.be.undefined
  })

  it('should initialize the root node on initialization', () => {
    //
  })

  it('should append the root node to the DOM on initialization', () => {
    //
  })
})
