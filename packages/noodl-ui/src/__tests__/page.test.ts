// Component type: page
import { expect } from 'chai'
import { waitFor } from '@testing-library/dom'
import chalk from 'chalk'
import sinon from 'sinon'
import { ComponentInstance, NOODLComponent } from '../types'
import { noodlui } from '../utils/test-utils'
import { event as eventId } from '../constants'
import Component from '../components/Base'
import Resolver from '../Resolver'
import Viewport from '../Viewport'

let path = 'HelloPage' as const
let pageObject = {
  genders: [
    { key: 'Gender', value: 'Male' },
    { key: 'Gender', value: 'Female' },
    { key: 'Gender', value: 'Other' },
  ],
}
let noodlComponent: NOODLComponent
let generatedComponents = [
  {
    type: 'view',
    children: [
      {
        type: 'list',
        contentType: 'listObject',
        iteratorVar: 'itemObject',
        listObject: pageObject.genders,
        children: [
          { type: 'image', path: 'abc.png' },
          { type: 'label', dataKey: 'itemObject.key' },
        ],
      },
    ],
  },
] as NOODLComponent[]

beforeEach(() => {
  noodlComponent = {
    type: 'page',
    path,
  } as NOODLComponent
  // TODO - Find out why our test this fails when we take async off
  // noodlui.on(eventId.NEW_PAGE_REF, async () => {})
  noodlui.setPage('Hello')
  noodlui.use({
    getRoot: () => ({
      Hello: {},
      [path]: { ...pageObject, components: generatedComponents },
    }),
    getPages: () => ['Hello', path],
  })
})

describe(`component: ${chalk.keyword('orange')('page')}`, () => {
  it(
    `should get the children in the root object by using the path (page) ` +
      ` as the key`,
    async () => {
      const spy = sinon.spy()
      const component = noodlui.resolveComponents(noodlComponent)
      component.on(eventId.component.page.COMPONENTS_RECEIVED, spy)
      await waitFor(() => {
        expect(spy).to.be.called
        expect(spy).to.be.calledWith(generatedComponents)
      })
    },
  )

  it(`should resolve the children using the children it grabbed from the root object`, async () => {
    const spy = sinon.spy()
    const component = noodlui.resolveComponents(noodlComponent)
    component.on(eventId.component.page.RESOLVED_COMPONENTS, spy)
    await waitFor(() => {
      expect(spy).to.be.called
      const args = spy.args[0][0]
      expect(args).to.include.members(component.children())
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
