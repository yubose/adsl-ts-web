import { NOODLComponent, ProxiedComponent } from '../types'

export const mock = (function () {
  function _getNOODLListObject() {
    return [
      { fruits: ['apple'], name: 'michael' },
      { fruits: ['banana'], name: 'harry' },
    ] as any[]
  }

  const raw = (function () {
    const o = {
      getNOODLButton() {
        return {
          type: 'button',
          onClick: [
            {
              actionType: 'updateObject',
              dataKey: 'MeetingLobbyStart.inviteesInfo.edge',
              dataObject: 'itemObject',
            },
            {
              actionType: 'evalObject',
              object: { '..inviteesInfo.edge.tage@': -1 },
            },
            { actionType: 'saveObject', object: '..update' },
            { actionType: 'refresh' },
          ],
          text: 'Delete',
          style: {
            left: '0.75',
            fontSize: '16',
            textAlign: { x: 'center' },
            border: { style: '1' },
          },
        }
      },
      getNOODLLabel1() {
        return {
          type: 'label',
          text: 'J',
          dataKey: 'itemObject.name.firstName',
          style: {
            height: '0.08',
            display: 'inline',
            textAlign: { x: 'center', y: 'center' },
          },
        }
      },
      getNOODLLabel2() {
        return {
          type: 'label',
          dataKey: 'itemObject.name.firstName',
          text: 'John',
          style: { left: '0.25' },
        }
      },
      getNOODLLabel3() {
        return {
          type: 'label',
          dataKey: 'itemObject.name.lastName',
          text: 'Smith',
          style: { color: '0x000000ff' },
        }
      },
      getNOODLList({
        listObject = _getNOODLListObject(),
        iteratorVar = 'itemObject',
        ...rest
      }: {
        listObject?: any
        iteratorVar?: string
        [key: string]: any
      } = {}) {
        return {
          type: 'list',
          contentType: 'listObject',
          listObject,
          iteratorVar,
          style: { width: '0.2' },
          children: [o.getNOODLListItem({ iteratorVar })],
          ...rest,
        }
      },
      getNOODLListItem({
        iteratorVar = 'itemObject',
        data = '',
        ...rest
      }: { data?: any; iteratorVar?: string } = {}) {
        return {
          type: 'listItem',
          [iteratorVar]: data,
          style: { left: '0', border: { style: '1' } },
          children: [
            o.getNOODLLabel1(),
            o.getNOODLLabel2(),
            o.getNOODLLabel3(),
            o.getNOODLButton(),
          ],
          ...rest,
        } as NOODLComponent
      },
      getNOODLView() {
        return {
          type: 'view',
          viewTag: 'subStream',
          required: false,
          style: { fontStyle: 'bold', height: '0.15', borderRadius: '5' },
        }
      },
    }
    return o
  })()

  const lvl2parsed = {}

  const proxied = {
    list: { type: 'ul', style: { left: '0px' } } as ProxiedComponent,
    children: [
      {
        type: 'li',
        style: {
          borderColor: '#00000011',
          borderRadius: '0px',
          borderBottomStyle: 'solid',
          listStyle: 'none',
          padding: 0,
        },
        children: [
          {
            type: 'label',
            style: {
              fontSize: '32px',
              color: '#ffffffff',
              backgroundColor: '#ff8f90ff',
              display: 'inline',
            },
            id:
              '_rwnkwj4ha-_ewn6jc9q3[2]-_ok6o739pk[0]-itemObject.name.hostName[0]',
            'data-name': 'hostName',
            'data-key': 'itemObject.name.hostName',
            'data-value': 'Invited Room 1',
          },
          {
            type: 'label',
            style: {
              left: '136.79999999999998px',
              top: '50.64px',
            },
            id:
              '_rwnkwj4ha-_ewn6jc9q3[2]-_ok6o739pk[0]-itemObject.name.roomName[1]',
            'data-name': 'roomName',
            'data-key': 'itemObject.name.roomName',
            'data-value': 'Test Room 1',
          },
          {
            type: 'img',
            style: { outline: 'none' },
            id: '_rwnkwj4ha-_ewn6jc9q3[2]-_ok6o739pk[0]-_0u69fhg3k[2]',
            src:
              'https://s3.us-east-2.amazonaws.com/public.aitmed.com/cadl/aitmedmeeting2_0.1/assets/rightArrow.png',
          },
        ],
      } as ProxiedComponent,
    ],
  }

  return {
    raw,
    lvl2parsed,
    proxied,
    other: {
      getNOODLListObject: _getNOODLListObject,
    },
  }
})()
