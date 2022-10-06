import * as mock from 'noodl-test-utils'
import * as u from '@jsmanifest/utils'
import fs from 'fs-extra'
import path from 'path'
import { ComponentObject } from 'noodl-types'
// import { getMostRecentApp } from '../../utils/test-utils'

// const pageObject = fs.readJsonSync(path.join(__dirname, './pageObject.json'))

function getMockMeetingChat({
  participants = [],
  viewTag,
}: {
  participants?: any[]
  viewTag?: {
    minimizeVideoChat?: {
      component?: Partial<
        ComponentObject & {
          global?: boolean
          float?: boolean
          audioStream?: boolean
          videoStream?: boolean
        }
      >
    }
    videoTimer?: {
      component?: Partial<ComponentObject> & {
        'text=func'?: (...args: any[]) => any
      }
    }
  }
} = {}) {
  const listData = {
    chatList: {
      doc: [
        {
          id: 'Y9+Hj2uLTsFIC6Ooq16cQQ==',
          ctime: 1620173226,
          mtime: 1620173226,
          atime: 1620173226,
          atimes: 1,
          tage: 0,
          subtype: {
            isOnServer: true,
            isZipped: false,
            isBinary: false,
            isEncrypted: false,
            isEditable: true,
            applicationDataType: 0,
            mediaType: 0,
            size: 19,
          },
          type: 1537,
          name: {
            title: '',
            user: 'Abc123',
            type: 'application/json',
            data: {
              note: 'hello!??',
            },
            tags: [],
          },
          deat: null,
          size: 19,
          fid: 'IAR4M3B5RnFz8mz+9Bt05g==',
          eid: 'n9PVxxXGSBqmLrxt8DSeSQ==',
          bsig: 'KyRGNeLKTPscmfAfMyKktw==',
          esig: 'n9PVxxXGSBqmLrxt8DSeSQ==',
          created_at: 1620173226000,
          modified_at: 1620173226000,
        },
        {
          id: 'sWGIOAyPSwp2MojnKbuPew==',
          ctime: 1620173217,
          mtime: 1620173217,
          atime: 1620173217,
          atimes: 1,
          tage: 0,
          subtype: {
            isOnServer: true,
            isZipped: false,
            isBinary: false,
            isEncrypted: false,
            isEditable: true,
            applicationDataType: 0,
            mediaType: 0,
            size: 29,
          },
          type: 1537,
          name: {
            title: '',
            user: 'Abc123',
            type: 'application/json',
            data: {
              note: 'cascasafsafasdasas',
            },
            tags: [],
          },
          deat: null,
          size: 29,
          fid: 'IAR4M3B5RnFz8mz+9Bt05g==',
          eid: 'n9PVxxXGSBqmLrxt8DSeSQ==',
          bsig: 'KyRGNeLKTPscmfAfMyKktw==',
          esig: 'n9PVxxXGSBqmLrxt8DSeSQ==',
          created_at: 1620173217000,
          modified_at: 1620173217000,
        },
        {
          id: 'XB7pP27rQQxgG2q3t2IXvw==',
          ctime: 1620173211,
          mtime: 1620173211,
          atime: 1620173211,
          atimes: 1,
          tage: 0,
          subtype: {
            isOnServer: true,
            isZipped: false,
            isBinary: false,
            isEncrypted: false,
            isEditable: true,
            applicationDataType: 0,
            mediaType: 0,
            size: 24,
          },
          type: 1537,
          name: {
            title: '',
            user: 'Abc123',
            type: 'application/json',
            data: {
              note: 'cascasafsafas',
            },
            tags: [],
          },
          deat: null,
          size: 24,
          fid: 'IAR4M3B5RnFz8mz+9Bt05g==',
          eid: 'n9PVxxXGSBqmLrxt8DSeSQ==',
          bsig: 'KyRGNeLKTPscmfAfMyKktw==',
          esig: 'n9PVxxXGSBqmLrxt8DSeSQ==',
          created_at: 1620173211000,
          modified_at: 1620173211000,
        },
        {
          id: '6vHBLmSrQF14vFmaS7DyDA==',
          ctime: 1620173195,
          mtime: 1620173195,
          atime: 1620173195,
          atimes: 1,
          tage: 0,
          subtype: {
            isOnServer: true,
            isZipped: false,
            isBinary: false,
            isEncrypted: false,
            isEditable: true,
            applicationDataType: 0,
            mediaType: 0,
            size: 17,
          },
          type: 1537,
          name: {
            title: '',
            user: 'Abc123',
            type: 'application/json',
            data: {
              note: 'cascas',
            },
            tags: [],
          },
          deat: null,
          size: 17,
          fid: 'IAR4M3B5RnFz8mz+9Bt05g==',
          eid: 'n9PVxxXGSBqmLrxt8DSeSQ==',
          bsig: 'KyRGNeLKTPscmfAfMyKktw==',
          esig: 'n9PVxxXGSBqmLrxt8DSeSQ==',
          created_at: 1620173195000,
          modified_at: 1620173195000,
        },
        {
          id: '8hbCAOA3S05KB7EtulLULA==',
          ctime: 1620173057,
          mtime: 1620173057,
          atime: 1620173057,
          atimes: 1,
          tage: 0,
          subtype: {
            isOnServer: true,
            isZipped: false,
            isBinary: false,
            isEncrypted: false,
            isEditable: true,
            applicationDataType: 0,
            mediaType: 0,
            size: 25,
          },
          type: 1537,
          name: {
            title: '',
            user: 'Abc123',
            type: 'application/json',
            data: {
              note: 'fafwafawfwafwa',
            },
            tags: [],
          },
          deat: null,
          size: 25,
          fid: 'IAR4M3B5RnFz8mz+9Bt05g==',
          eid: 'n9PVxxXGSBqmLrxt8DSeSQ==',
          bsig: 'KyRGNeLKTPscmfAfMyKktw==',
          esig: 'n9PVxxXGSBqmLrxt8DSeSQ==',
          created_at: 1620173057000,
          modified_at: 1620173057000,
        },
        {
          id: 'KDLCqy9WQudcPBaWT5sd1w==',
          ctime: 1620173050,
          mtime: 1620173050,
          atime: 1620173050,
          atimes: 1,
          tage: 0,
          subtype: {
            isOnServer: true,
            isZipped: false,
            isBinary: false,
            isEncrypted: false,
            isEditable: true,
            applicationDataType: 0,
            mediaType: 0,
            size: 20,
          },
          type: 1537,
          name: {
            title: '',
            user: 'Abc123',
            type: 'application/json',
            data: {
              note: 'fawfwafwa',
            },
            tags: [],
          },
          deat: null,
          size: 20,
          fid: 'IAR4M3B5RnFz8mz+9Bt05g==',
          eid: 'n9PVxxXGSBqmLrxt8DSeSQ==',
          bsig: 'KyRGNeLKTPscmfAfMyKktw==',
          esig: 'n9PVxxXGSBqmLrxt8DSeSQ==',
          created_at: 1620173050000,
          modified_at: 1620173050000,
        },
        {
          id: 'RmmoaQqvTgpp/oio0YyptA==',
          ctime: 1620170085,
          mtime: 1620170085,
          atime: 1620170085,
          atimes: 1,
          tage: 0,
          subtype: {
            isOnServer: true,
            isZipped: false,
            isBinary: false,
            isEncrypted: false,
            isEditable: true,
            applicationDataType: 0,
            mediaType: 0,
            size: 19,
          },
          type: 1537,
          name: {
            title: '',
            user: 'Abc123',
            type: 'application/json',
            data: {
              note: 'helloa??',
            },
            tags: [],
          },
          deat: null,
          size: 19,
          fid: 'IAR4M3B5RnFz8mz+9Bt05g==',
          eid: 'n9PVxxXGSBqmLrxt8DSeSQ==',
          bsig: 'KyRGNeLKTPscmfAfMyKktw==',
          esig: 'n9PVxxXGSBqmLrxt8DSeSQ==',
          created_at: 1620170085000,
          modified_at: 1620170085000,
        },
        {
          id: 'mx/nqq9ES3FDKcSpZNmUKg==',
          ctime: 1620170074,
          mtime: 1620170074,
          atime: 1620170074,
          atimes: 1,
          tage: 0,
          subtype: {
            isOnServer: true,
            isZipped: false,
            isBinary: false,
            isEncrypted: false,
            isEditable: true,
            applicationDataType: 0,
            mediaType: 0,
            size: 25,
          },
          type: 1537,
          name: {
            title: '',
            user: 'Abc123',
            type: 'application/json',
            data: {
              note: 'content of doc',
            },
            tags: [],
          },
          deat: null,
          size: 25,
          fid: 'IAR4M3B5RnFz8mz+9Bt05g==',
          eid: 'n9PVxxXGSBqmLrxt8DSeSQ==',
          bsig: 'KyRGNeLKTPscmfAfMyKktw==',
          esig: 'n9PVxxXGSBqmLrxt8DSeSQ==',
          created_at: 1620170074000,
          modified_at: 1620170074000,
        },
        {
          id: 'uPsg45SAShJFoivJ3Fn7WQ==',
          ctime: 1620169511,
          mtime: 1620169511,
          atime: 1620169511,
          atimes: 1,
          tage: 0,
          subtype: {
            isOnServer: true,
            isZipped: false,
            isBinary: false,
            isEncrypted: false,
            isEditable: true,
            applicationDataType: 0,
            mediaType: 0,
            size: 19,
          },
          type: 1537,
          name: {
            title: '',
            user: 'Abc123',
            type: 'application/json',
            data: {
              note: 'dsfdsfsd',
            },
            tags: [],
          },
          deat: null,
          size: 19,
          fid: 'IAR4M3B5RnFz8mz+9Bt05g==',
          eid: 'n9PVxxXGSBqmLrxt8DSeSQ==',
          bsig: 'KyRGNeLKTPscmfAfMyKktw==',
          esig: 'n9PVxxXGSBqmLrxt8DSeSQ==',
          created_at: 1620169511000,
          modified_at: 1620169511000,
        },
        {
          id: 'QjBuHSXrQINrwiNmhWb/RQ==',
          ctime: 1620169481,
          mtime: 1620169481,
          atime: 1620169481,
          atimes: 1,
          tage: 0,
          subtype: {
            isOnServer: true,
            isZipped: false,
            isBinary: false,
            isEncrypted: false,
            isEditable: true,
            applicationDataType: 0,
            mediaType: 0,
            size: 17,
          },
          type: 1537,
          name: {
            title: '',
            user: 'Abc123',
            type: 'application/json',
            data: {
              note: 'hello!',
            },
            tags: [],
          },
          deat: null,
          size: 17,
          fid: 'IAR4M3B5RnFz8mz+9Bt05g==',
          eid: 'n9PVxxXGSBqmLrxt8DSeSQ==',
          bsig: 'KyRGNeLKTPscmfAfMyKktw==',
          esig: 'n9PVxxXGSBqmLrxt8DSeSQ==',
          created_at: 1620169481000,
          modified_at: 1620169481000,
        },
      ],
      error: '',
      jwt: 'cvcCUzJRT1R1WwKSPZzvGA==',
      code: 0,
    },
  }

  const pageObject = {
    pageNumber: '180',
    title: 'Meeting Chat',
    init: [
      mock.getIfObject(),
      mock.getIfObject(),
      mock.getIfObject(),
      { '.Global.DocReference.document@': '=.MeetingChat.newNote.document' },
      {
        '.MeetingChat.newNote.document.name.targetRoomName@':
          '=.Global.rootRoomInfo.edge.name.roomName',
      },
      { '..newestMsg@': '=..listData.chatList.doc.0' },
    ],
    save: [
      {
        '.MeetingChat.newChat.document.fid@':
          '=.MeetingChat.newNote.document.id',
      },
      { '=.MeetingChat.newChat.docAPI.store': '' },
      { '.Global.DocReference.document@': '=.MeetingChat.newNote.document' },
    ],
    listData,
    onNewMessageToDisplay: [
      mock.getEvalObjectAction(),
      mock.getBuiltInAction({ funcName: 'redraw', viewTag: 'ChatList' }),
    ],
    components: [
      mock.getRegisterComponent({
        onEvent: 'onNewMessageDisplay',
        emit: mock.getFoldedEmitObject({
          dataKey: { var: 'onNewMessageDisplay' },
          actions: [
            mock.getEvalObjectAction(),
            mock.getBuiltInAction({ funcName: 'redraw', viewTag: 'ChatList' }),
          ],
        }),
      }),
      mock.getPopUpComponent({
        viewTag: 'noTitle',
        message: 'Please input note title',
        style: { top: '0.3', left: '0.06', width: '0.88', height: '0.3' },
        children: [
          mock.getLabelComponent({
            text: 'Please input note title',
            text2: 'v',
            text3: 'v',
            text4: 'ok',
            style: { top: '0.08', left: '0', width: '0.89333', height: '0.05' },
          }),
          mock.getButtonComponent({
            text: 'ok',
            style: { width: '0.2', left: '0.35', height: '0.05', top: '0.2' },
            onClick: [mock.getPopUpDismissAction('noTitle')],
          }),
          mock.getHeaderComponent({
            children: [mock.getButtonComponent({ text: 'Meeting Chat' })],
          }),
          mock.getButtonComponent({
            onClick: [
              mock.getEvalObjectAction(),
              mock.getGotoObject({
                dataIn: { destination: 'VideoChat', reload: false },
              }),
            ],
            children: [
              mock.getImageComponent('backWhiteArrow.png'),
              mock.getLabelComponent('Back'),
            ],
          }),
        ],
      }),
    ] as ComponentObject[],
  }

  return pageObject
}

export default getMockMeetingChat
