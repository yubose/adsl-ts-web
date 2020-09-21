import { expect } from 'chai'
import { NOODLComponent, NOODLComponentProps } from 'noodl-ui'
import _ from 'lodash'
import { NOODLElement } from 'app/types'
import { noodl } from '../setupTests'
import Substreams from './Substreams'

const mockParticipant = {
  sid: 'mysid123',
  identity: 'chris',
}

let container: NOODLElement
let component: NOODLComponentProps
let subStreams: Substreams

beforeEach(() => {
  component = noodl.resolveComponents(getUnparsedListComponent())[0]
  // container = parser.parse(component) as NOODLElement
  container = document.createElement(component.type)
  subStreams = new Substreams(container, component)
})

describe('Substreams', () => {
  it('', () => {
    //
  })
})

function getUnparsedListComponent() {
  return {
    type: 'list',
    contentType: 'vidoeSubStream',
    listObject: '',
    iteratorVar: 'itemObject',
    style: {
      axis: 'horizontal',
      left: '0.04',
      top: '0.62',
      width: '0.92',
      height: '0.15',
    },
    children: [
      {
        type: 'listItem',
        itemObject: '',
        style: {
          left: '0',
          top: '0',
          width: '0.18',
          height: '0.15',
          border: {
            style: '1',
          },
        },
        children: [
          {
            type: 'view',
            viewTag: 'subStream',
            style: {
              left: '0.015',
              top: '0',
              width: '0.15',
              height: '0.15',
              border: {
                style: '5',
              },
              borderRadius: '5',
            },
          },
        ],
      },
    ],
  } as NOODLComponent
}

function getListComponent() {
  return {
    type: 'ul',
    contentType: 'vidoeSubStream',
    listObject: '',
    iteratorVar: 'itemObject',
    style: {
      axis: 'horizontal',
      left: '18.04px',
      top: '493.52px',
      width: '414.92px',
      height: '119.39999999999999px',
      position: 'absolute',
      outline: 'none',
      display: 'flex',
      flexWrap: 'nowrap',
    },
    children: [],
    parentId: '_5sxgmcu0e',
    id: '_5sxgmcu0e-_m3ezl3cu3[6]',
    inputType: 'vidoeSubStream',
    'data-ux': 'vidoeSubStream',
    'data-listdata': [
      {
        id: '',
        name: '',
        type: '0',
        ctime: '',
        subtype: '',
        bvid: '',
        evid: '',
        tage: '',
      },
    ],
    'data-listid': '_5sxgmcu0e-_m3ezl3cu3[6]',
    blueprint: {
      type: 'li',
      itemObject: '',
      style: {
        left: '0px',
        top: '0px',
        width: '81.17999999999999px',
        height: '119.39999999999999px',
        position: 'relative',
        outline: 'none',
        borderStyle: 'none',
        borderRadius: '0px',
        listStyle: 'none',
        padding: 0,
      },
      children: [
        {
          type: 'div',
          viewTag: 'subStream',
          style: {
            left: '6.765px',
            top: '0px',
            width: '67.64999999999999px',
            height: '119.39999999999999px',
            borderRadius: '5px',
            position: 'absolute',
            outline: 'none',
            borderStyle: 'none',
          },
          parentId: '_vxgdfl3qv',
          id: '_vxgdfl3qv-_9wob084p0[0]',
          'data-ux': 'subStream',
        },
      ],
    },
  }
}
