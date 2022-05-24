import { expect } from 'chai'
import { fp, is } from '@noodl/core'
import y from 'yaml'
import factory from '../factory/ast'
import unwrap from '../utils/unwrap'

describe(`factory`, () => {
  describe(`ast`, () => {
    describe(`action`, () => {
      it(`should set the string arg as actionType`, () => {
        expect(factory.action('evalObject').get('actionType')).to.eq(
          'evalObject',
        )
      })

      it(`should merge props`, () => {
        expect(factory.action({ goto: 'SignIn' }).get('goto')).to.eq('SignIn')
      })
    })

    describe(`builtInFn`, () => {
      it(`should create all props as yaml nodes`, () => {
        const node = factory.builtInFn(
          'string.equal',
          {
            string1: '$var.key',
            string2: 'hello',
          },
          'Dashboard.formData.password',
        )
        expect(node).to.be.instanceOf(y.YAMLMap)
        expect(node.get('=.builtIn.string.equal')).to.be.instanceOf(y.YAMLMap)
        expect(
          node.get('=.builtIn.string.equal')?.get('dataIn', true),
        ).to.be.instanceOf(y.YAMLMap)
        expect(
          node.get('=.builtIn.string.equal')?.get('dataOut', true),
        ).to.be.instanceOf(y.Scalar)
      })

      it(`should create built in fn for =.builtIn.string.equal`, () => {
        const node = factory.builtInFn(
          'string.equal',
          {
            string1: '$var.key',
            string2: 'hello',
          },
          'Dashboard.formData.password',
        )
        expect(node.toJSON()).to.deep.eq({
          '=.builtIn.string.equal': {
            dataIn: { string1: '$var.key', string2: 'hello' },
            dataOut: 'Dashboard.formData.password',
          },
        })
      })
    })

    describe(`if`, () => {
      it(`should create an if node`, () => {
        const node = factory.if()
        const json = node.toJSON()
        expect(node).to.be.instanceOf(y.YAMLMap)
        expect(json.if).to.be.an('array')
        expect(json.if).to.have.lengthOf(3)
      })
    })
  })

  // describe.skip(`cst`, () => {
  //   it(`should create a comment token`, () => {
  //     const token = factory.comment({ indent: 0 })
  //     expect(token).to.have.property('type', 'comment')
  //   })

  //   it(`should create a space token`, () => {
  //     const token = factory.space({ indent: 0 })
  //     expect(token).to.have.property('type', 'space')
  //   })

  //   it(`should create a blockScalar token`, () => {
  //     const token = factory.blockScalar('hello')
  //     expect(token).to.have.property('type', 'block-scalar')
  //     expect(token).to.have.property('source', 'hello')
  //   })

  //   it(`should create a blockMap token`, () => {
  //     const token = factory.blockMap()
  //     expect(token).to.have.property('type', 'block-map')
  //   })

  //   it(`should create a blockSeq token`, () => {
  //     const token = factory.blockSeq()
  //     expect(token).to.have.property('type', 'block-seq')
  //   })

  //   it(`should create a document token`, () => {
  //     const token = factory.document()
  //     expect(token).to.have.property('type', 'document')
  //   })

  //   it(`should create a tag token`, () => {
  //     const token = factory.tag()
  //     expect(token).to.have.property('type', 'tag')
  //   })

  //   describe(`blockMap`, () => {
  //     xit(`should create a map object when received as an array`, () => {
  //       //
  //     })

  //     it.only(`should create a builtIn eval function object`, () => {
  //       const token = factory.blockMap({
  //         items: [
  //           {
  //             start: [],
  //             key: factory.scalar('=.builtIn.string.equals'),
  //             sep: [
  //               factory.mapColon(),
  //               factory.scalar(' '),
  //               factory.newline(),
  //               factory.space(2),
  //               factory.scalar('dataIn'),
  //               factory.scalar(':'),
  //               factory.space(),
  //             ],
  //             value: factory.blockMap({
  //               indent: 4,
  //               offset: 5,
  //               items: [
  //                 {
  //                   start: [],
  //                   // key: factory.sca
  //                 },
  //               ],
  //             }),
  //           },
  //         ],
  //       })

  //       const yml = y.CST.stringify(token)
  //       const json = y.parse(yml)

  //       console.log(yml)
  //       console.log(json)
  //     })
  //   })
  // })
})
