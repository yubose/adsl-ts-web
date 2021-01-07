// Component type: page
import { expect } from 'chai'
import { waitFor } from '@testing-library/dom'
import chalk from 'chalk'
import sinon from 'sinon'
import { ComponentInstance, NOODLComponent } from '../types'
import { noodlui } from '../utils/test-utils'
import { event as eventId } from '../constants'
import Component from '../components/Base'
import Viewport from '../Viewport'

let noodlComponent: NOODLComponent
let receivedComponents = [
  { type: 'view', children: [{ type: 'image', path: 'abc.png' }] },
] as NOODLComponent[]
let eventHandler = async () => receivedComponents

beforeEach(() => {
  noodlComponent = {
    type: 'page',
    path: 'HelloPage',
  } as NOODLComponent
  noodlui.on(eventId.RETRIEVE_COMPONENTS, eventHandler)
})

describe(`component: ${chalk.keyword('orange')('page')}`, () => {
  it(
    `should be able to receive the raw noodl components from a ` +
      `subscribed observer`,
    async () => {
      const spy = sinon.spy()
      const component = noodlui.resolveComponents(noodlComponent)
      component.on(eventId.component.page.COMPONENTS_RECEIVED, spy)
      await waitFor(() => {
        expect(spy).to.be.calledWith(receivedComponents)
      })
    },
  )

  it(`should be able to receive the resolved components as children`, async () => {
    const spy = sinon.spy()
    const component = noodlui.resolveComponents(noodlComponent)
    component.on(eventId.component.page.RESOLVED_COMPONENTS, spy)
    await waitFor(() => {
      expect(spy).to.be.called
      const args = spy.args[0][0]
      expect(args).to.have.property('raw')
      expect(args).to.have.property('component')
      expect(args).to.have.property('children')
      expect(args.children).to.be.an('array')
      expect(args.children[0]).to.be.instanceOf(Component)
    })
  })

  it(`should append the received resolved component children as its children`, async () => {
    const spy = sinon.spy()
    const component = noodlui.resolveComponents(noodlComponent)
    component.on(eventId.component.page.RESOLVED_COMPONENTS, spy)
    await waitFor(() => {
      const args = spy.args[0][0]
      expect(args.children).to.include.members(component.children())
      component.children().forEach((child) => {
        expect(component.hasChild(child)).to.be.true
      })
    })
  })

  xit(`the resolved component children should have been using their own viewport`, async () => {
    const viewport = new Viewport()
    viewport.width = 200
    viewport.height = 200
    noodlui.setViewport(viewport, 'HelloPage')
    const spy = sinon.spy()
    const component = noodlui.resolveComponents(noodlComponent)
    component.on(eventId.component.page.RESOLVED_COMPONENTS, spy)
    await waitFor(() => {
      const args = spy.args[0][0]
      expect(args.children).to.include.members(component.children())
      component.children().forEach((child) => {
        expect(component.hasChild(child)).to.be.true
      })
    })
  })
})
