import { expect } from 'chai'
import fs from 'fs-extra'
import path from 'path'
import * as nt from 'noodl-types'
import * as u from '@jsmanifest/utils'
import sinon from 'sinon'
import y from 'yaml'
import * as yu from 'yaml/util'
import { consts, Diagnostics } from '@noodl/core'
import Root from '../DocRoot'
import createNode from '../utils/createNode'
import get from '../utils/get'
import is from '../utils/is'
import deref from '../utils/deref'
import unwrap from '../utils/unwrap'
import DocDiagnostics from '../DocDiagnostics'
import DocVisitor from '../DocVisitor'

let root: Root

beforeEach(() => {
  root = new Root()
  root.set('Topo', {
    formData: {
      password: '123',
      email: 'pfft@gmail.com',
      currentIcon: '..icon',
      gender: 'Male',
    },
    icon: 'arrow.svg',
  })
  root.set('SignIn', {
    email: 'lopez@yahoo.com',
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
  })
})

describe(`deref`, () => {
  it(`[set] should set keys as strings when given a node`, () => {
    const CerealPage = createNode({})
    const key = createNode('Cereal')
    root.set(key, CerealPage)
    expect(root.value.has('Cereal')).to.be.true
  })

  it(`[has] should work with Scalar nodes`, () => {
    root.set('Cereal', createNode({}))
    expect(root.has('Cereal')).to.be.true
    expect(root.has(new y.Scalar('Cereal'))).to.be.true
  })

  it(`[remove] should work with Scalar nodes`, () => {
    root.set('Cereal', createNode({}))
    expect(root.has('Cereal')).to.be.true
    root.remove(new y.Scalar('Cereal'))
    expect(root.has(new y.Scalar('Cereal'))).to.be.false
    expect(root.has('Cereal')).to.be.false
  })

  it(`should initiate the state expectedly`, () => {
    const spy = sinon.spy()
    const ref = '.SignIn.components.1.children.0.text'
    deref({ node: ref, root, rootKey: 'SignIn', subscribe: { onUpdate: spy } })
    const firstCallArgs = spy.firstCall.args
    const initialState = firstCallArgs[1]
    expect(initialState).to.have.deep.property('paths', [
      'components',
      '1',
      'children',
      '0',
      'text',
    ])
    expect(initialState).to.have.property('results').to.have.lengthOf(0)
  })

  it(`should update the next state's path and paths expectedly`, () => {
    const spy = sinon.spy()
    const ref = '.SignIn.components.1.children.0.text'
    deref({ node: ref, root, rootKey: 'SignIn', subscribe: { onUpdate: spy } })
    const secondCallArgs = spy.secondCall.args
    const secondCallNextState = secondCallArgs[1]
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
      { key: 'components', value: root.get('SignIn.components') },
    ])
    expect(thirdCallNextState).to.have.deep.property('results', [
      { key: 'components', value: root.get('SignIn.components') },
      { key: '1', value: root.get('SignIn.components.1') },
    ])
    expect(thirdCallNextState).to.have.deep.property('results', [
      { key: 'components', value: root.get('SignIn.components') },
      { key: '1', value: root.get('SignIn.components.1') },
    ])
    expect(fourthCallNextState).to.have.deep.property('results', [
      { key: 'components', value: root.get('SignIn.components') },
      { key: '1', value: root.get('SignIn.components.1') },
      { key: 'children', value: root.get('SignIn.components.1.children') },
    ])
    expect(fifthCallNextState).to.have.deep.property('results', [
      { key: 'components', value: root.get('SignIn.components') },
      { key: '1', value: root.get('SignIn.components.1') },
      { key: 'children', value: root.get('SignIn.components.1.children') },
      { key: '0', value: root.get('SignIn.components.1.children.0') },
    ])
    expect(sixthCallNextState).to.have.deep.property('results', [
      { key: 'components', value: root.get('SignIn.components') },
      { key: '1', value: root.get('SignIn.components.1') },
      { key: 'children', value: root.get('SignIn.components.1.children') },
      { key: '0', value: root.get('SignIn.components.1.children.0') },
      {
        key: 'text',
        value: 'lopez@yahoo.com',
      },
    ])
  })

  it(`should set resolved references on the "value" key `, () => {
    const ref = '.SignIn.components.1.children.0.text'
    const result = deref({
      node: ref,
      root,
      rootKey: 'SignIn',
    })
    expect(result).to.have.property('value', 'lopez@yahoo.com')
  })

  it(`should be able to resolve multiple chains of root references`, () => {
    const signinDoc = root.get('SignIn')
    const topoDoc = root.get('Topo')
    root.set('Pencil', {
      listObject: [
        'hi',
        3,
        {
          options: [
            {
              gender: [
                { value: 'Female' },
                { value: '.SignIn.formData.gender' },
                { value: 'Other' },
              ],
              findGender: '.Topo.redirect.realGenderLocation',
            },
          ],
        },
        { what: {} },
      ],
    })
    signinDoc.set('dog', '.Topo.findMyGender')
    topoDoc.set('findMyGender', '.Pencil.listObject.2.options.0.findGender')
    topoDoc.set('redirect', {
      realGenderLocation: '.Pencil.listObject.2.options.0.gender.1.value',
    })
    signinDoc.set('formData', { gender: '.Topo.formData.gender' })
    expect(
      deref({
        node: new y.Scalar('.SignIn.dog'),
        root,
        rootKey: 'SignIn',
      }),
    ).to.have.property('value', 'Male')
  })

  it(`should be able to resolve multiple chains of local references`, () => {
    const getResult = (ref: string) =>
      deref({
        node: ref,
        root,
        rootKey: 'Topo',
      }).value
    const topoDoc = root.get('Topo')
    topoDoc.set('cat', '..formData.currentIcon')
    expect(getResult('..formData.currentIcon')).to.eq('arrow.svg')
    topoDoc.set('cat', {
      cloudy: {
        sunset: {
          oneOf: ['abc', '..formData.currentIcon'],
        },
      },
    })
    expect(getResult('..formData.currentIcon')).to.eq('arrow.svg')
  })
})

describe(`Diagnostics`, () => {
  let diagnostics: Diagnostics
  let docVisitor: DocVisitor

  beforeEach(() => {
    docVisitor = new DocVisitor()
    diagnostics = new DocDiagnostics()
    diagnostics.use(docVisitor)
    diagnostics.use(root)
    root.set('BaseHeader', {
      type: 'header',
      style: { width: '1', height: 'auto', top: '0.1', left: '0.125' },
    })
    root.set('Cereal', {
      icon: '..realIcon',
      realIcon: 'you-found-me.png',
      components: [
        '.BaseHeader',
        { type: 'button', text: '..icon' },
        { type: 'label', text: '..iconName' },
      ],
    })
    root.set('Style', {
      shadow: 'true',
    })
  })

  xit(`should pass in the pageName`, () => {
    const spy = sinon.spy()
    const results = diagnostics.run({
      enter: spy,
    })
    expect(spy.callCount).to.be.greaterThan(0)
    const calledPageNames = [] as string[]

    spy.getCalls().forEach((call) => {
      expect(call.args[0]).to.have.property('name').not.to.be.empty
      const pageName = call.args[0].name
      expect(pageName).to.be.oneOf(['Cereal', 'Topo', 'SignIn'])
      if (!calledPageNames.includes(pageName)) {
        calledPageNames.push(pageName)
      }
    })

    expect(calledPageNames).to.have.all.members(['Cereal', 'SignIn', 'Topo'])
  })

  it(`should replace references with their values`, async () => {
    const results = await diagnostics.run({
      enter: ({
        add,
        data,
        key,
        name: page,
        value: node,
        root,
        path: nodePath,
      }) => {
        if (is.scalarNode(node) && is.reference(node)) {
          // console.log({ node, page })
          const derefed = deref({
            node,
            root,
            rootKey: page,
          })
          if (typeof derefed.value === 'undefined') {
            add({
              node,
              messages: [
                {
                  type: consts.ValidatorType.INFO,
                  message: `Reference '${derefed.reference}' was not resolvable`,
                },
              ],
              page,
              ...derefed,
            })
          } else {
            return createNode(derefed.value)
            // node.value = derefed.value
          }
        }
      },
    })

    console.dir(
      results.map((result) => result.toJSON()),
      { depth: Infinity },
    )

    const messages = [...diagnostics.root.value.entries()].map(([name, obj]) =>
      obj.toJSON(),
    )

    fs.writeJsonSync(path.join(__dirname, 'messages.json'), messages, {
      spaces: 2,
    })
  })
})
