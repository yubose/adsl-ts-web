import { expect } from 'chai'
import fs from 'fs-extra'
import path from 'path'
import sinon from 'sinon'
import { consts, Diagnostics } from '@noodl/core'
import Root from '../DocRoot'
import createNode from '../utils/createNode'
import is from '../utils/is'
import deref from '../utils/deref'
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

describe(`DocDiagnostics`, () => {
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
    diagnostics.run({ enter: spy })
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
