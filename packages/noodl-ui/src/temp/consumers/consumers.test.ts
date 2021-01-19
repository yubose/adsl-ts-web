import chalk from 'chalk'
import sinon, { spy } from 'sinon'
import produce from 'immer'
import { expect } from 'chai'
import { consumer as c, presets } from '../../constants'
import { util } from '../ComponentResolver'
import consumers from './index'
import * as u from '../../utils/internal'
import * as T from '../../types'

const consumerMap = consumers.reduce((acc, obj) => {
  acc[obj.id] = obj as any
  return acc
}, {} as { [K in typeof c.ids[keyof typeof c.ids]]: T.ConsumerObject })

describe(chalk.keyword('orange')('consumers'), () => {
  describe(`when evaluating on how to run the resolver func`, () => {
    it(`should support dot paths for narrowing the getter`, () => {
      const spy = sinon.spy()
      const component = {
        type: 'view',
        style: { fontSize: '12' },
        children: [{ type: 'image', path: 'abc.png' }],
      }
      const obj = {
        type: c.types.MORPH,
        prop: 'children[0].path',
        resolve: spy,
      }
      util.Consumer.consume(obj)(component)
      expect(spy.firstCall.args[0]).to.have.property('value', 'abc.png')
      util.Consumer.consume({ ...obj, prop: 'style.fontSize' })(component)
      expect(spy.secondCall.args[0]).to.have.property('value', '12')
    })
    describe(`when the "prop" property was passed in`, () => {
      it(`should run the resolve func automatically when there is no "cond" func passed in`, () => {
        const spy = sinon.spy()
        util.Consumer.consume({ type: c.types.MORPH, resolve: spy })({} as any)
        expect(spy).to.be.called
      })
      it(`should run the "cond" func first before running resolve func if it was passed in`, () => {
        const obj = {
          type: c.types.MORPH,
          resolve: sinon.spy(),
          prop: 'type',
          cond: sinon.spy(() => true),
        }
        util.Consumer.consume(obj)({ type: 'view' })
        expect(obj.resolve).to.be.calledAfter(obj.cond)
      })
      it(`should ${chalk.red(
        'not',
      )} run the resolve func if the cond returns false`, () => {
        const obj = {
          type: c.types.MORPH,
          prop: 'style',
          resolve: sinon.spy(),
          cond: sinon.spy(() => false),
        }
        util.Consumer.consume(obj)({ type: 'view' })
        expect(obj.resolve).not.to.be.called
      })
    })
    describe(`when the "prop" property was ${chalk.red(
      'not',
    )} passed in`, () => {
      it(`should run the "resolve" func if the passed in cond func returns true`, () => {
        const obj = {
          type: c.types.MORPH,
          resolve: sinon.spy(),
          cond: sinon.spy(() => true),
        }
        util.Consumer.consume(obj)({ type: 'view' })
        expect(obj.resolve).to.be.called
      })
      it(`should ${chalk.red(
        'not',
      )} run the "resolve" func if the passed in cond func returns ${chalk.magenta(
        'false',
      )}`, () => {
        const obj = { type: c.types.MORPH, resolve: sinon.spy() }
        util.Consumer.consume(obj)({ type: 'view' })
        expect(obj.resolve).to.be.called
      })
    })
    describe(`when both "prop" and "cond" is not passed in`, () => {
      it(`should automatically run the "resolve" func`, () => {
        const obj = {
          type: c.types.MORPH,
          resolve: sinon.spy(),
          cond: sinon.spy(() => true),
        }
        util.Consumer.consume(obj)({ type: 'view' })
        expect(obj.resolve).to.be.calledAfter(obj.cond)
      })
    })
  })

  describe(`when deciding how to pass in args`, () => {
    describe(`when the "prop" property was passed in`, () => {
      let obj: Omit<T.ConsumerObject, 'resolve'> & { resolve: sinon.SinonSpy }

      beforeEach(() => {
        obj = {
          type: c.types.MORPH,
          prop: 'style:fontSize',
          resolve: sinon.spy(),
        }
        util.Consumer.consume(obj)({ type: 'view', style: { fontSize: '12' } })
      })

      describe(`when prefixing with ${chalk.magenta('style:')}`, () => {
        it(`should pass in "key" as "style"`, () => {
          expect(obj.resolve.firstCall.firstArg).to.have.property(
            'key',
            'style',
          )
        })
        it(`should pass in "styleKey" as the key in the style object`, () => {
          expect(obj.resolve.firstCall.firstArg).to.have.property(
            'styleKey',
            'fontSize',
          )
        })

        it(`should pass in "value" as the value of style[styleKey]`, () => {
          expect(obj.resolve.firstCall.firstArg).to.have.property('value', '12')
        })
      })
    })
  })

  describe(`when using the returned values from "resolve"`, () => {
    describe(`when the "prop" property was passed in`, () => {
      describe(c.types.MORPH, () => {
        it.only(`should spread the return value props on the style object if prefixed with "style:"`, () => {
          const newBorder = { borderRadius: '0px', borderWidth: '1px' }
          const obj = {
            type: c.types.MORPH,
            prop: 'style:border',
            resolve: () => newBorder,
          }
          let component = {
            type: 'view',
            style: { border: { style: '2' } },
          } as any
          component = produce(component, (draft: any) => {
            util.Consumer.consume(obj)(draft)
          })
          console.info(component)
          expect(component.style).to.have.property(
            'borderRadius',
            newBorder.borderRadius,
          )
          expect(component.style).to.have.property('borderStyle', 'none')
          expect(component.style).to.have.property('borderBottomStyle', 'solid')
        })
        xit(`should spread the return value props ${chalk.magenta(
          'outside',
        )} of the style object if ${chalk.red(
          'not',
        )} prefixed with "style:"`, () => {
          //
        })
      })
      describe(c.types.REMOVE, () => {
        xit(`should ignore the return values`, () => {
          //
        })
      })
      describe(c.types.RENAME, () => {
        xit(`should use the return value to rename the prop on the style object if prefixed with "style:"`, () => {
          //
        })
        xit(`should use the return value to rename the prop on the component object if ${chalk.red(
          'not',
        )} prefixed with "style:"`, () => {
          //
        })
      })
      describe(c.types.REPLACE, () => {
        xit(`should use the return value to replace the value of component.style[styleKey] if prefixed with "style:"`, () => {
          //
        })
        xit(`should use the return value to replace the value of component[key] if ${chalk.red(
          'not',
        )} prefixed with "style:"`, () => {
          //
        })
      })
    })
    describe(`when the "prop" property was ${chalk.red(
      'not',
    )} passed in`, () => {
      xit(`should directly just assign the value given to the component object/style object`, () => {
        //
      })
    })
  })

  describe(`morph`, () => {
    xit(`should remove the passed in prop`, () => {
      //
    })

    xit(`should merge the return value object to the surrounding object`, () => {
      //
    })
  })

  describe(`remove`, () => {
    xit(``, () => {
      //
    })
  })

  describe(`rename`, () => {
    xit(``, () => {
      //
    })
  })

  describe(`replace`, () => {
    xit(``, () => {
      //
    })
  })
})
