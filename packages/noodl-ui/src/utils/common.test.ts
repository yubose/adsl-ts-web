import _ from 'lodash'
import { expect } from 'chai'
import { NOODLComponent } from '../types'
import { forEachEntries, forEachDeepEntries, isAllString } from './common'

describe('forEachDeepEntries', () => {
  const listComponent = getMockListComponent()
  const entries = [] as any[]

  let next = [] as any[]

  forEachEntries(listComponent, (key, value) => {
    entries.push(key)
    if (_.isPlainObject(value) || _.isArray(value)) {
      next.push(value)
    }
  })

  while (next.length) {
    const value = next.shift()
    if (_.isArray(value)) {
      _.forEach(value, (val) => {
        if (_.isPlainObject(val) || _.isArray(val)) {
          next.push(val)
        }
      })
    } else if (_.isPlainObject(value)) {
      forEachEntries(value, (key, val) => {
        entries.push(key)
        if (_.isPlainObject(val) || _.isArray(val)) {
          next.push(val)
        }
      })
    }
  }

  it('should traverse deeply nested object properties', () => {
    const results = []
    forEachDeepEntries(listComponent, (key, value) => {
      results.push(key)
    })
    expect(_.difference(entries, results).length).to.eq(0)
  })
})

describe('isAllString', () => {
  it('should return true', () => {
    expect(isAllString(['undefined', '55', 'affs', 'vcw', ";';,."])).to.be.true
    expect(isAllString('f')).to.be.true
    expect(isAllString('null')).to.be.true
    expect(isAllString('false')).to.be.true
    expect(isAllString('5')).to.be.true
  })

  it('should return false', () => {
    expect(isAllString(['undefined', undefined, 'fls'])).to.be.false
    expect(isAllString(['undefined', null, 'fls'])).to.be.false
    expect(isAllString(['undefined', () => {}, 'fls'])).to.be.false
    expect(isAllString(['undefined', 5, 'fls'])).to.be.false
  })
})

function getMockListComponent(): NOODLComponent {
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
