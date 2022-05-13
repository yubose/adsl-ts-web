import { expect } from 'chai'
import * as nt from 'noodl-types'
import * as u from '@jsmanifest/utils'
import sinon from 'sinon'
import y from 'yaml'
import * as yu from 'yaml/util'
import { Diagnostics } from '@noodl/core'
import Root from '../DocRoot'
import is from '../utils/is'
import deref from '../utils/deref'
import { DocVisitor } from '../../dist'

let root: Root

beforeEach(() => {
  root = new Root()
  root.set(
    'Topo',
    new y.Document({
      formData: {
        password: '123',
        email: 'pfft@gmail.com',
        currentIcon: '..icon',
      },
      icon: 'arrow.svg',
    }),
  )
  root.set(
    'SignIn',
    new y.Document({
      components: [
        { type: 'button', text: '..greeting' },
        {
          type: 'view',
          children: [
            { type: 'label', text: '.SignIn.email' },
            { type: 'textField', dataKey: 'SignIn.email' },
          ],
        },
      ],
    }),
  )
})

describe(`deref`, () => {
  it(`should initiate the state expectedly`, () => {
    const spy = sinon.spy()
    const ref = '.SignIn.components.1.children.0.text'
    deref({ node: ref, root, rootKey: 'SignIn', subscribe: { onUpdate: spy } })
    const firstCallArgs = spy.firstCall.args
    const initialState = firstCallArgs[1]
    expect(initialState).to.have.property('currentKey', 'SignIn')
    expect(initialState).to.have.property(
      'currentDataObject',
      root.value.get('SignIn'),
    )
    expect(initialState).to.have.property('currentIsLocal', false)
    expect(initialState).to.have.property('nextKey', 'components')
    expect(initialState).to.have.property(
      'path',
      'components.1.children.0.text',
    )
    expect(initialState).to.have.deep.property('paths', [
      'components',
      '1',
      'children',
      '0',
      'text',
    ])
    expect(initialState).to.have.property(
      'reference',
      '.SignIn.components.1.children.0.text',
    )
    expect(initialState).to.have.property('results').to.have.lengthOf(0)
  })

  it(`should update the next state's path and paths expectedly`, () => {
    const spy = sinon.spy()
    const ref = '.SignIn.components.1.children.0.text'
    const results = deref({
      node: ref,
      root,
      rootKey: 'SignIn',
      subscribe: { onUpdate: spy },
    })
    const secondCallArgs = spy.secondCall.args
    const secondCallNextState = secondCallArgs[1]
    expect(secondCallNextState).to.have.property('currentKey', 'components')
    expect(secondCallNextState).to.have.property(
      'path',
      'components.1.children.0.text',
    )
    expect(secondCallNextState).to.have.deep.property('paths', [
      '1',
      'children',
      '0',
      'text',
    ])
  })

  it(`should update the next state's results expectedly`, () => {
    const spy = sinon.spy()
    const ref = '.SignIn.components.1.children.0.text'
    const results = deref({
      node: ref,
      root,
      rootKey: 'SignIn',
      subscribe: { onUpdate: spy },
    })
    const secondCallNextState = spy.secondCall.args[1]
    const thirdCallNextState = spy.thirdCall.args[1]
    const fourthCallNextState = spy.getCall(3).args[1]
    const fifthCallNextState = spy.getCall(4).args[1]
    const sixthCallNextState = spy.getCall(5).args[1]
    expect(secondCallNextState).to.have.deep.property('results', [
      { key: 'components', value: root.get('SignIn').get('components') },
    ])
    expect(thirdCallNextState).to.have.deep.property('results', [
      { key: 'components', value: root.get('SignIn').get('components') },
      { key: '1', value: root.get('SignIn').get('components').get(1) },
    ])
    expect(thirdCallNextState).to.have.deep.property('results', [
      { key: 'components', value: root.get('SignIn').get('components') },
      { key: '1', value: root.get('SignIn').get('components').get(1) },
    ])
    expect(fourthCallNextState).to.have.deep.property('results', [
      { key: 'components', value: root.get('SignIn').get('components') },
      { key: '1', value: root.get('SignIn').get('components').get(1) },
      {
        key: 'children',
        value: root.get('SignIn').get('components').get(1).get('children'),
      },
    ])
    expect(fifthCallNextState).to.have.deep.property('results', [
      { key: 'components', value: root.get('SignIn').get('components') },
      { key: '1', value: root.get('SignIn').get('components').get(1) },
      {
        key: 'children',
        value: root.get('SignIn').get('components').get(1).get('children'),
      },
      {
        key: '0',
        // prettier-ignore
        value: root.get('SignIn').get('components').get(1).get('children').get(0),
      },
    ])
    expect(sixthCallNextState).to.have.deep.property('results', [
      { key: 'components', value: root.get('SignIn').get('components') },
      { key: '1', value: root.get('SignIn').get('components').get(1) },
      {
        key: 'children',
        value: root.get('SignIn').get('components').get(1).get('children'),
      },
      {
        key: '0',
        // prettier-ignore
        value: root.get('SignIn').get('components').get(1).get('children').get(0),
      },
      {
        key: 'text',
        // prettier-ignore
        value: root.get('SignIn').get('components').get(1).get('children') .get(0).get('text'),
      },
    ])
    // console.dir(results.refNode, { depth: Infinity })
  })
})

describe(`Diagnostics`, () => {
  let diagnostics: Diagnostics
  let docVisitor: DocVisitor

  beforeEach(() => {
    docVisitor = new DocVisitor()
    diagnostics = new Diagnostics()
    diagnostics.use(docVisitor)
    diagnostics.use(root)
    root.set(
      'Cereal',
      new y.Document({
        icon: '..components.0.abc',
        components: [{ type: 'button', text: '..icon' }],
      }),
    )
  })

  it(``, async () => {
    const results = await diagnostics.run({
      async: true,
      enter: ({ name: pageName, key, value: node, path, data, add, root }) => {
        if (!data[pageName]) data.pageName = []
        add({
          pageName,
          key,
          value: node,
          messages: [],
        })
      },
    })

    diagnostics.register(diagnostics.createDiagnostic({}))

    console.log(results.map((s) => s.toJSON()))
  })
})
