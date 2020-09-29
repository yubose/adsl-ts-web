import { expect } from 'chai'
import { getByPlaceholderText, screen } from '@testing-library/dom'
import NOODLUIDOM from './noodl-ui-dom'

let noodluidom: NOODLUIDOM

beforeEach(() => {
  noodluidom = new NOODLUIDOM()
})

describe('noodl-ui-dom', () => {
  it('should have attached the placeholder', () => {
    const newRoomInfo = { edge: { name: { roomName: 'hello all' } } }
    const placeholder = 'Please type the title here'
    const pageObject = {
      module: 'patient',
      newRoomInfo,
      components: [
        {
          type: 'view',
          children: [
            {
              type: 'textField',
              placeholder,
              dataKey: 'newRoomInfo.edge.name.roomName',
              style: { top: '0.13' },
            },
          ],
        },
      ],
    } as any
    noodl
      .setRoot({ MeetingRoomCreate: pageObject })
      .setPage({ name: 'MeetingRoomCreate', object: pageObject })
    const props = noodl.resolveComponents()[0]
    const node = parser.parse(props) as HTMLElement
    document.body.appendChild(node)
    expect(getByPlaceholderText(document.body, placeholder))
  })

  it('should have attached the data value', () => {
    const newRoomInfo = { edge: { name: { roomName: 'hello all' } } }
    const pageObject = {
      module: 'patient',
      newRoomInfo,
      components: [
        {
          type: 'view',
          children: [
            {
              type: 'textField',
              dataKey: 'newRoomInfo.edge.name.roomName',
              style: { top: '0.13' },
            },
          ],
        },
      ],
    } as any
    noodl
      .setRoot({ MeetingRoomCreate: pageObject })
      .setPage({ name: 'MeetingRoomCreate', object: pageObject })
    const props = noodl.resolveComponents()[0]
    console.info(props)
    const node = parser.parse(props) as HTMLElement
    document.body.appendChild(node)
    expect(screen.getByDisplayValue('hello all'))
  })
})
