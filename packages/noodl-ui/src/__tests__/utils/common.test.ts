import difference from 'lodash/difference'
import isPlainObject from 'lodash/isPlainObject'
import { expect } from 'chai'
import { forEachEntries, forEachDeepEntries } from '../../utils/common'
import { ComponentObject } from 'noodl-types'

describe(`common utilities`, () => {
  describe('forEachDeepEntries', () => {
    const listComponent = getMockListComponent()
    const entries = [] as any[]

    let next = [] as any[]

    forEachEntries(listComponent, (key, value) => {
      entries.push(key)
      if (isPlainObject(value) || Array.isArray(value)) {
        next.push(value)
      }
    })

    while (next.length) {
      const value = next.shift()
      if (Array.isArray(value)) {
        value.forEach((val) => {
          if (isPlainObject(val) || Array.isArray(val)) {
            next.push(val)
          }
        })
      } else if (isPlainObject(value)) {
        forEachEntries(value, (key, val) => {
          entries.push(key)
          if (isPlainObject(val) || Array.isArray(val)) {
            next.push(val)
          }
        })
      }
    }

    it('should traverse deeply nested object properties', () => {
      const results = [] as any[]
      forEachDeepEntries(listComponent, (key, value) => {
        results.push(key)
      })
      expect(difference(entries, results).length).to.eq(0)
    })
  })
})

function getMockListComponent(): ComponentObject {
  return {
    type: 'list',
    contentType: 'listObject',
    listObject: [
      {
        id: '',
        name: {
          hostName: 'Invited Room 1',
          roomName: 'Test Room 1',
        },
        type: '0',
        ctime: '',
        subtype: '',
        bvid: '',
        evid: '',
        tage: '',
      },
      {
        id: '',
        name: {
          hostName: 'Invited Room 2',
          roomName: 'Test Room 2',
        },
        type: '0',
        ctime: '',
        subtype: '',
        bvid: '',
        evid: '',
        tage: '',
      },
    ],
    iteratorVar: 'itemObject',
    style: {
      left: '0',
      top: '0.2',
      width: '1',
      height: '0.8',
    },
    children: [
      {
        type: 'listItem',
        itemObject: '',
        onClick: [
          {
            actionType: 'updateObject',
            dataKey: 'Global.VideoChatObjStore.reference.edge',
            dataObject: 'itemObject',
          },
          {
            actionType: 'pageJump',
            destination: 'VideoChat',
          },
        ],
        style: {
          left: '0',
          top: '0',
          width: '1',
          height: '0.15',
          border: {
            style: '2',
          },
          borderWidth: '1',
          borderColor: '0x00000011',
        },
        children: [
          {
            type: 'label',
            dataKey: 'itemObject.name.hostName',
            style: {
              left: '0.08',
              top: '0.03',
              width: '0.15',
              height: '0.08',
              fontSize: '32',
              fontStyle: 'bold',
              color: '0xffffffff',
              backgroundColor: '0xff8f90ff',
              display: 'inline',
              textAlign: {
                x: 'center',
                y: 'center',
              },
            },
          },
          {
            type: 'label',
            dataKey: 'itemObject.name.roomName',
            style: {
              left: '0.25',
              top: '0.06',
              width: '0.74',
              height: '0.03',
              fontSize: '18',
              color: '0x000000ff',
            },
          },
          {
            type: 'image',
            path: 'rightArrow.png',
            style: {
              left: '0.88',
              top: '0.02',
              width: '0.08',
              height: '0.04',
            },
          },
        ],
      },
    ],
  }
}
