import chalk from 'chalk'
import sinon from 'sinon'
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
      xit(`should run the resolve func automatically when there is no "cond" func passed in`, () => {
        //
      })
      xit(`should run the "cond" func first before running resolve func if it was passed in`, () => {
        //
      })
      xit(`should run the "resolve" func if the cond returns true`, () => {
        //
      })
      xit(`should ${chalk.red(
        'not',
      )} run the resolve func if the cond returns false`, () => {
        //
      })
    })
    describe(`when the "prop" property was ${chalk.red(
      'not',
    )} passed in`, () => {
      xit(`should run the "resolve" func if the passed in cond func returns true`, () => {
        //
      })
      xit(`should ${chalk.red(
        'not',
      )} run the "resolve" func if the passed in cond func returns ${chalk.magenta(
        'false',
      )}`, () => {
        //
      })
    })
    describe(`when both "prop" and "cond" is not passed in`, () => {
      xit(`should automatically run the "resolve" func`, () => {
        //
      })
    })
  })

  describe(`when deciding how to pass in args`, () => {
    describe(`when the "prop" property was passed in`, () => {
      describe(`when prefixing with ${chalk.magenta('style:')}`, () => {
        xit(`should pass in "key" as "style"`, () => {
          //
        })
        xit(`should pass in "styleKey" as the key in the style object`, () => {
          //
        })

        xit(`should pass in "value" as the value of style[styleKey]`, () => {
          //
        })
      })
      describe(`when the "prop" property was ${chalk.red(
        'not',
      )} passed in`, () => {
        xit(`should pass in "key" as the property of the component object`, () => {
          //
        })
        xit(`should pass in "value" as the value from component[key]`, () => {
          //
        })
      })

      describe(`${chalk.magenta(`type: ${c.types.MORPH}`)}`, () => {
        xit(``, () => {
          //
        })
      })
      describe(`${chalk.magenta(`type: ${c.types.REMOVE}`)}`, () => {
        xit(``, () => {
          //
        })
      })
      describe(`${chalk.magenta(`type: ${c.types.RENAME}`)}`, () => {
        xit(``, () => {
          //
        })
      })
      describe(`${chalk.magenta(`type: ${c.types.REPLACE}`)}`, () => {
        xit(``, () => {
          //
        })
      })
    })

    describe(`when the "prop" property was ${chalk.red(
      'not',
    )} passed in`, () => {
      describe(`${chalk.magenta(`type: ${c.types.MORPH}`)}`, () => {
        xit(``, () => {
          //
        })
      })
      describe(`${chalk.magenta(`type: ${c.types.REMOVE}`)}`, () => {
        xit(``, () => {
          //
        })
      })
      describe(`${chalk.magenta(`type: ${c.types.RENAME}`)}`, () => {
        xit(``, () => {
          //
        })
      })
      describe(`${chalk.magenta(`type: ${c.types.REPLACE}`)}`, () => {
        xit(``, () => {
          //
        })
      })
    })
  })

  describe(`when expecting and using the "resolve" func return values`, () => {
    describe(`when the "prop" property was passed in`, () => {
      describe(`morph`, () => {
        describe(`when it is prefixed with "${chalk.magenta(
          'style:',
        )}"`, () => {
          xit(`should spread the return value props on the style object if prefixed with "style:"`, () => {
            //
          })
          xit(`should spread the return value props ${chalk.magenta(
            'outside',
          )} of the style object if ${chalk.red(
            'not',
          )} prefixed with "style:"`, () => {
            //
          })
        })
      })
      describe(`remove`, () => {
        xit(`should ignore the return values`, () => {
          //
        })
      })
      describe(`rename`, () => {
        xit(`should use the return value to rename the prop on the style object if prefixed with "style:"`, () => {
          //
        })
        xit(`should use the return value to rename the prop on the component object if ${chalk.red(
          'not',
        )} prefixed with "style:"`, () => {
          //
        })
      })
      describe(`replace`, () => {
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
