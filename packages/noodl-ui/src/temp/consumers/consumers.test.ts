import chalk from 'chalk'
import sinon from 'sinon'
import { expect } from 'chai'
import { consumer as c, presets } from '../../constants'
import { util } from '../ComponentResolver'
import * as T from '../../types'

describe(chalk.keyword('orange')('consumers'), () => {
  describe(`setup`, () => {
    xit(`should run before all other consumers (consumers at the end get called before others)`, () => {
      //
    })
  })

  describe(`when evaluating on how to run the resolver func`, () => {
    describe(`when "prop" is an array`, () => {
      xit(`should run consume all keys in the props list`, () => {
        //
      })
    })

    it(`should ${chalk.red(
      'never',
    )} run the resolve func if the component is ${chalk.yellow(
      'undefined',
    )}`, () => {
      const spy = sinon.spy()
      const component = undefined
      const obj = {
        type: c.types.MORPH,
        prop: 'children[0].path',
        resolve: spy,
      }
      util.Consumer.consume(obj)(component as any)
      expect(spy).not.to.be.called
    })

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
        util.Consumer.consume({ type: c.types.MORPH, resolve: spy } as any)(
          {} as any,
        )
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
        } as any
        util.Consumer.consume(obj)({ type: 'view' })
        expect(obj.resolve).to.be.called
      })
      it(`should ${chalk.red(
        'not',
      )} run the "resolve" func if the passed in cond func returns ${chalk.magenta(
        'false',
      )}`, () => {
        const obj = { type: c.types.MORPH, resolve: sinon.spy() } as any
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
        util.Consumer.consume(obj as any)({ type: 'view' })
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
        it(`should spread the return value props on the style object if prefixed with "style:"`, () => {
          const component = {
            type: 'view',
            style: { border: { style: '2' } },
          } as any
          util.Consumer.consume({
            type: c.types.MORPH,
            prop: 'style:border',
            resolve: () => presets.border['2'],
          })(component)
          Object.entries(presets.border['2']).forEach(([key, value]) => {
            expect(component.style).to.have.property(key, value)
          })
        })

        it(`should spread the return value props ${chalk.magenta(
          'outside',
        )} of the style object if ${chalk.red(
          'not',
        )} prefixed with "style:"`, () => {
          const resolvedResult = { hello: 'hi', fruits: ['apple', 'orange'] }
          const component = {
            type: 'textField',
            placeholder: 'hello, all!',
          } as any
          util.Consumer.consume({
            type: c.types.MORPH,
            prop: 'placeholder',
            resolve: () => resolvedResult,
          })(component)
          Object.entries(component).forEach(([key, value]) => {
            expect(component).to.have.property(key, value)
          })
        })
      })
      describe(c.types.REMOVE, () => {
        it(`should ignore the return values`, () => {
          const component = { type: 'view' }
          util.Consumer.consume({
            type: c.types.REMOVE,
            prop: 'type',
            resolve: () => 'hello',
          })(component)
          expect(component).not.to.have.property('type')
        })
      })
      describe(c.types.RENAME, () => {
        it(`should use the return value to rename the prop on the style object if prefixed with "style:"`, () => {
          const component = {
            type: 'textField',
            style: { zIndex: '100' },
          } as any
          util.Consumer.consume({
            type: c.types.RENAME,
            prop: 'style:zIndex',
            resolve: () => 'vicePresident',
          })(component)
          expect(component.style).to.have.property('vicePresident', '100')
          expect(component.style).not.to.have.property('zIndex')
        })
        it(`should use the return value to rename the prop on the component object if ${chalk.red(
          'not',
        )} prefixed with "style:"`, () => {
          const styleObj = { zIndex: '100' }
          const component = {
            type: 'textField',
            style: styleObj,
          } as any
          util.Consumer.consume({
            type: c.types.RENAME,
            prop: 'style',
            resolve: () => 'fruits',
          })(component)
          expect(component).to.have.property('fruits', styleObj)
          expect(component).not.to.have.property('style')
        })
      })
      describe(c.types.REPLACE, () => {
        it(`should use the return value to replace the value of component.style[styleKey] if prefixed with "style:"`, () => {
          const styleObj = { zIndex: '100' }
          const component = {
            type: 'textField',
            style: { fontSize: '12', axis: 'horizontal' },
          } as any
          util.Consumer.consume({
            type: c.types.REPLACE,
            prop: 'style:fontSize',
            resolve: () => styleObj,
          })(component)
          expect(component.style).to.have.property('fontSize', styleObj)
        })
        it(`should use the return value to replace the value of component[key] if ${chalk.red(
          'not',
        )} prefixed with "style:"`, () => {
          const styleObj = { zIndex: '100' }
          const component = {
            type: 'textField',
            style: { fontSize: '12', axis: 'horizontal' },
          } as any
          util.Consumer.consume({
            type: c.types.REPLACE,
            prop: 'style',
            resolve: () => styleObj,
          })(component)
          expect(component).to.have.property('style', styleObj)
        })
      })
    })
  })

  describe(`side effects of operations`, () => {
    describe(`morph`, () => {
      it(`should remove the passed in prop`, () => {
        const component = {
          type: 'textField',
          style: { fontSize: '12', axis: 'horizontal' },
        } as any
        util.Consumer.consume({
          type: c.types.MORPH,
          prop: 'style',
          resolve: () => ({ zIndex: '100' }),
        })(component)
        expect(component).not.to.have.property('style')
      })
    })
  })

  describe(`when concluding the consumer object `, () => {
    describe(`"finally"`, () => {
      describe(`when "finally" is a function`, () => {
        it(`should run the func  after resolve is run`, () => {
          const obj = {
            type: c.types.MORPH,
            prop: 'style',
            resolve: sinon.spy(),
            finally: sinon.spy(),
          }
          util.Consumer.consume(obj)({
            type: 'textField',
            style: { fontSize: '12', axis: 'horizontal' },
          })
          expect(obj.finally).to.be.called
          expect(obj.resolve).to.be.calledBefore(obj.finally)
        })
        describe(`when "finally" is a consumer object`, () => {
          it(`should call consume on it (recursion)`, () => {
            const consumeSpy = sinon.spy(util.Consumer, 'consume')
            const obj = {
              type: c.types.MORPH,
              prop: 'style',
              resolve: sinon.spy(),
              finally: {
                type: c.types.RENAME,
                prop: 'type',
                resolve: sinon.spy(() => 'abc'),
              },
            }
            const component = {
              type: 'textField',
              style: { fontSize: '12', axis: 'horizontal' },
            } as any
            util.Consumer.consume(obj)(component)
            expect(obj.finally.resolve).to.be.called
            expect(obj.finally.resolve.args[0][0]).to.have.property(
              'type',
              c.types.RENAME,
            )
            expect(consumeSpy).to.be.calledTwice
            expect(component).not.to.have.property('type')
            expect(component).to.have.property('abc', 'textField')
            consumeSpy.restore()
          })
        })
      })
    })
  })
})
