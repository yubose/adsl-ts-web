import { expect } from 'chai'
import _ from 'lodash'
import List from '../../components/List'
import { findChild } from 'noodl-utils'
import { noodlui } from '../../utils/test-utils'
import { forEachDeepChildren, getDataObjectValue } from '../../utils/noodl'
import { _resolveChildren } from './helpers'

describe('helpers', () => {
  describe('_resolveChildren', () => {
    it('should call the callback on each resolved child', () => {
      const encounteredChildren = [] as any[]
      const noodlComponent = {
        type: 'view',
        children: [
          { type: 'view', children: [{ type: 'label', dataKey: 'greeting' }] },
          { type: 'label', dataKey: 'formData.greeting' },
          { type: 'image', dataKey: 'abc.png' },
        ],
      }
      const component = noodlui.resolveComponents(noodlComponent)
      _resolveChildren(component, {
        onResolve: (c) => encounteredChildren.push(c),
        resolveComponent: noodlui.getConsumerOptions({ component })
          .resolveComponent,
      })
      expect(encounteredChildren).to.have.lengthOf(3)
    })
  })

  describe('_redraw', () => {
    xit('should deeply update children', () => {
      //
    })
  })

  describe('testing', () => {
    xit('testing syntax', () => {
      const noodlComponent = {
        type: 'view',
        style: {
          width: '0.8',
          height: '0.3',
          shadow: 'false',
          backgroundColor: '0x388eccff',
        },
        viewTag: 'topo',
        children: [
          {
            type: 'view',
            children: [
              { type: 'label', dataKey: 'formData.myData' },
              { type: 'image', path: 'selectOn.png' },
            ],
          },
          {
            type: 'label',
            text: 'Please continue',
            style: { color: '0x330033ff', fontSize: '16' },
          },
        ],
      }
      const changes = [
        {
          style: { width: '0.3', shadow: 'true' },
          viewTag: 'topo',
          children: [
            {
              children: [{ 'data-value': 'abc123' }, { path: 'selectOff.png' }],
            },
            { text: 'You may not continue', color: '0x000000ff' },
          ],
        },
      ]

      interface PatchDataObject {
        type: 'data-object'
        dataObject?: any
      }

      interface PatchStyleObject {
        type: 'style'
        changes: { key: string; value: any }[]
      }

      interface PatchKeyValueObject {
        type: 'key-value'
        changes: { key: string; value: any }
      }

      const patches = (function () {
        const _patches = []

        function _dataObject({
          component,
          dataObject,
          patches,
        }: {
          component: any
          dataObject: any
          patches: any
        }) {
          forEachDeepChildren(component, (child) => {
            if (patches[child.id]) {
              if (patches.type === 'key-value') {
                if (child.has('dataKey')) {
                  let changed = false
                  let dataKey
                  let dataValue
                  let iteratorVar

                  const onDataValue = (value: any) => {
                    dataValue = value
                    if (_.isString(dataValue) || _.isNumber(dataValue)) {
                      if (dataValue !== component.get('data-value')) {
                        changed = true
                      }
                    } else {
                      changed = true
                    }
                  }

                  dataKey = child.get('dataKey')

                  if (child.has('iteratorVar')) {
                    iteratorVar = child.get('iteratorVar')
                    onDataValue(
                      getDataObjectValue({ dataObject, dataKey, iteratorVar }),
                    )
                  } else {
                    onDataValue(_.get(dataObject, dataKey))
                  }

                  if (changed) component.set('data-value', dataValue)
                }
              }
            }
          })
        }

        function _style() {
          //
        }

        const o = {
          patch(options: { type: string; changes: any; component: any }) {
            switch (options.type) {
              case 'data-object':
                return void _dataObject(options.component, options.changes)
              case 'key-value':
              case 'style':
              default:
                break
            }
          },
        }

        return _.reduce(
          _.entries(o),
          (acc, [k, fn]) => {
            acc[k] = (...args) => {
              fn(...args)
            }
            return acc
          },
          {},
        )
      })()
    })

    xit('testing broadcast', () => {
      const noodlComponent = {
        type: 'view',
        style: {
          width: '0.8',
          height: '0.3',
          shadow: 'false',
          backgroundColor: '0x388eccff',
        },
        viewTag: 'topo',
        children: [
          {
            type: 'view',
            children: [
              { type: 'label', dataKey: 'formData.myData' },
              { type: 'image', path: 'selectOn.png' },
              {
                type: 'list',
                iteratorVar: 'hello',
                listObject: [
                  { fruit: 'apple' },
                  { fruit: 'banana' },
                  { fruits: 'orange' },
                ],
                children: [
                  {
                    type: 'listItem',
                    style: { border: { style: '2' } },
                    children: [
                      {
                        type: 'label',
                        dataKey: 'hello.greeting',
                        style: { border: { style: '2' } },
                      },
                      {
                        type: 'button',
                        path: 'abc.png',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'label',
            text: 'Please continue',
            style: { color: '0x330033ff', fontSize: '16' },
          },
        ],
      }
      const component = noodlui.resolveComponents(noodlComponent)
      const listComponent = findChild(
        component,
        (c) => c.noodlType === 'list',
      ) as List
    })
  })
})
