import { expect } from 'chai'
import chalk from 'chalk'
import sinon from 'sinon'
import y from 'yaml'
import { consts, is as coreIs } from '@noodl/core'
import Root from '../DocRoot'
import { createAssert } from '../assert'
import createNode from '../utils/createNode'
import is from '../utils/is'
import deref from '../utils/deref'
import DocDiagnostics from '../DocDiagnostics'
import DocVisitor, {
  clearState as clearVisitorState,
  getState as getVisitorState,
} from '../DocVisitor'
import * as com from '../compiler'
import * as c from '../constants'
import * as t from '../types'

let docDiagnostics: DocDiagnostics
let docRoot: Root
let docVisitor: DocVisitor

beforeEach(() => {
  docRoot = new Root()
  docVisitor = new DocVisitor()
  docDiagnostics = new DocDiagnostics()
  docDiagnostics.use(docVisitor)
  docDiagnostics.use(docRoot)
})

describe.only(`processors`, () => {
  describe.skip(`createInstructions`, () => {
    it(`should create instructions for reference strings`, () => {
      const ref = '.A.formData.currentIcon'
      const instructions = com.createInstructions(ref)
      console.dir(instructions, { depth: Infinity })
      console.log(instructions.length)
      expect(instructions).to.have.lengthOf(ref.length)
      instructions.forEach((instr, i) => expect(instr.value).to.eq(ref[i]))
      expect(instructions[0].type).to.eq('write')
      expect(instructions[1].type).to.eq('read')
    })
  })

  describe(`if`, () => {
    it(`should wrap if conditions`, () => {
      // process.stdout.write('\x1Bc')
      docRoot.clear()
      docRoot.set('A', { component: { type: 'label', text: 'Hello' } })
      docRoot.set('B', {
        component: { type: 'button', text: 'Submit' },
        components: [{ if: ['..profile', '..profile', 'A.component'] }],
      })
      const spy = sinon.spy()
      const wrapIf = (enter: t.AssertFn) => {
        return function _if(
          args: t.AssertFnArgs & { ifNode?: any; ifIndex?: any; state?: any },
        ) {
          if (args.state) {
            if (args.state === 'if') {
              const { node, ifIndex } = args
              const ifNode = node?.get?.('if') as any
              const ifItem = ifNode?.get?.(ifIndex)
              console.log(`[if] node`, ifNode)
              console.log(`[if] index: ${ifIndex}`)
              console.log(`[if] item`, ifItem)
              const ifItemKind = com.getIfNodeItemKind(ifIndex)
              console.log(`[if] ifItemKind`, ifItemKind)

              if (ifItemKind === c.IfItemKind.Condition) {
                //
              } else if (ifItemKind === c.IfItemKind.Truthy) {
                //
              } else if (ifItemKind === c.IfItemKind.Falsey) {
                //
              }
            }
          } else if (is.if(args.node as any)) {
            const result = enter(args)
            const isHandled = !coreIs.und(result)
            console.log(chalk.keyword('aquamarine')('result:'), result)
            if (!isHandled) {
              return _if({ ...args, state: 'if', ifIndex: 0 })
            } else {
              console.log(chalk.keyword('orange')('consumer handled'), result)
            }
          } else {
            return enter(args)
          }
        }
      }
      docDiagnostics.run({
        enter: wrapIf((args) => {
          const { add, node } = args
          if (node && is.if(node)) {
            console.log(chalk.keyword('navajowhite')(`[consumer] handling`))
            return 'handled'
          }
        }),
      })
    })
  })
})
