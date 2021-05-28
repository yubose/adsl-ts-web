import * as mock from 'noodl-ui-test-utils'
import { ComponentObject } from 'noodl-types'
import omit from 'lodash/omit'

export const cameraOnSrc = 'https://public.aitmed.com/commonRes/cameraOn.png'
export const cameraOffSrc = 'https://public.aitmed.com/commonRes/cameraOff.png'
export const micOnSrc = 'https://public.aitmed.com/commonRes/micOn.png'
export const micOffSrc = 'https://public.aitmed.com/commonRes/micOff.png'

function getVideoChatPageObject({
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
  const pageObject = {
    pageNumber: '190',
    cameraOn: true,
    micOn: true,
    miuAutoMicOffTimespan: '3',
    miuAutoMicOffThresdhold: '3',
    emptyId: '',
    save: ['..roomInfo.edgeAPI.store'],
    listData: { participants },
    components: [
      mock.getPopUpComponent({
        viewTag: 'underconstruction',
        message: 'Under construction...',
        style: { width: '0.88', height: '0.3', top: '0.3' },
        children: [
          mock.getLabelComponent({
            text: 'Under construction...',
            style: { top: '0.08', width: '0.89333', height: '0.05' },
          }),
          mock.getButtonComponent({
            text: 'ok',
            style: { height: '0.05', top: '0.2' },
            onClick: [
              mock.getPopUpDismissAction({
                onClick: [
                  {
                    actionType: 'popUpDismiss',
                    popUpView: 'underconstruction',
                  },
                ],
              }),
            ],
          }),
        ],
      }),
      mock.getRegisterComponent({
        onEvent: 'twilioOnPeopleJoin',
        actions: [
          mock.getBuiltInAction({
            funcName: 'hide',
            viewTag: 'waitForOtherTag',
          }),
        ],
      }),
      mock.getRegisterComponent({
        onEvent: 'twilioOnNoParticipant',
        actions: [
          mock.getBuiltInAction({
            funcName: 'show',
            viewTag: 'waitForOtherTag',
          }),
        ],
      }),
      mock.getViewComponent({
        style: { top: '0', height: '1' },
        children: [
          mock.getImageComponent({
            path: 'waitingroom.png',
            style: { top: '0', height: '1' },
          }),
          mock.getViewComponent({
            viewTag: 'mainStream',
            style: { top: '0', height: '1' },
          }),
          mock.getViewComponent({
            viewTag: 'selfStream',
            style: { top: '0.1', height: '0.15' },
          }),
          mock.getViewComponent({
            style: { top: '0', height: '0.07' },
            children: [
              mock.getLabelComponent({
                dataKey: 'roomInfo.edge.name.roomName',
                style: { top: '0', height: '55px' },
              }),
              mock.getLabelComponent({
                text: 'Switch Camera',
                style: { top: '0', height: '55px' },
                onClick: mock.getBuiltInAction({ funcName: 'switchCamera' }),
              } as any),
              mock.getImageComponent({
                path: 'logo.png',
                viewTag: 'waitForOtherTag',
                style: { top: '0.15' },
              }),
              mock.getLabelComponent({
                contentType: 'hidden',
                viewTag: 'waitForOtherTag',
                text: 'Waiting for others to join',
                style: { top: '0.3', height: '0.04' },
              }),
              mock.getListComponent({
                contentType: 'videoSubStream',
                listObject: [],
                iteratorVar: 'itemObject',
                style: { axis: 'horizontal', top: '0.62', height: '0.15' },
                children: [
                  mock.getListItemComponent({
                    itemObject: '',
                    style: { top: '0', height: '0.15' },
                    children: [
                      mock.getViewComponent({
                        viewTag: 'subStream',
                        style: { top: '0', height: '0.15' },
                      }),
                    ],
                  }),
                ],
              }),
              mock.getViewComponent({
                style: { top: '0.9', height: '0.1', position: 'fixed' },
                children: [
                  mock.getImageComponent({
                    viewTag: 'camera',
                    path: mock.getEmitObject({
                      actions: [
                        {
                          if: [
                            '=.VideoChat.cameraOn',
                            cameraOnSrc,
                            cameraOffSrc,
                          ],
                        },
                      ],
                    }),
                    onClick: [
                      mock.getFoldedEmitObject({
                        actions: [
                          {
                            if: [
                              '=.VideoChat.cameraOn',
                              { '.VideoChat.cameraOn@': false },
                              { '.VideoChat.cameraOn@': true },
                            ],
                          },
                        ],
                      }),
                      mock.getBuiltInAction({
                        funcName: 'redraw',
                        viewTag: 'camera',
                      }),
                      mock.getBuiltInAction({
                        funcName: 'toggleFlag',
                        dataKey: 'VideoChat.cameraOn',
                      }),
                    ],
                    style: { top: '0.03', height: '0.035' },
                  }),
                  mock.getImageComponent({
                    viewTag: 'microphone',
                    path: mock.getEmitObject({
                      actions: [
                        {
                          if: ['=.VideoChat.micOn', micOnSrc, micOffSrc],
                        },
                      ],
                    }),
                    onClick: [
                      mock.getFoldedEmitObject({
                        actions: [
                          {
                            if: [
                              '=.VideoChat.micOn',
                              { '.VideoChat.micOn@': false },
                              { '.VideoChat.micOn@': true },
                            ],
                          },
                        ],
                      }),
                      mock.getBuiltInAction({
                        funcName: 'redraw',
                        viewTag: 'microphone',
                      }),
                      mock.getBuiltInAction({
                        funcName: 'toggleFlag',
                        dataKey: 'VideoChat.micOn',
                      }),
                    ],
                    style: { top: '0.022', height: '0.05' },
                  }),
                  mock.getImageComponent({
                    path: 'hangUp.png',
                    onClick: [
                      mock.getEvalObjectAction(),
                      mock.getSaveObjectAction({
                        object: [['roomInfo.response.name', null]],
                      }),
                      mock.getGotoObject({ goto: 'MeetingRoomHistory' }),
                    ],
                  }),
                  mock.getViewComponent({
                    onClick: [
                      mock.getPopUpAction({
                        popUpView: 'selectView',
                        dismissOnTouchOutside: true,
                      }),
                    ],
                    children: [
                      mock.getImageComponent({ path: 'NavIcMore.png' }),
                    ],
                  }),
                  mock.getLabelComponent({
                    contentType: 'timer',
                    dataKey: 'Global.timer',
                    viewTag: 'videoTimer',
                    ...viewTag?.videoTimer?.component,
                  } as ComponentObject),
                ],
              }),
            ],
          }),
        ],
      }),
      mock.getPopUpComponent({
        viewTag: 'minimizeVideoChat',
        global: true,
        image: 'chat.png',
        audioStream: true,
        videoStream: true,
        onClick: [
          mock.getEvalObjectAction(),
          mock.getPopUpDismissAction({ popUpView: 'minimizeVideoChat' }),
        ],
        style: {
          top: '0',
          left: '0',
          float:
            typeof viewTag?.minimizeVideoChat?.component?.style?.float ===
            'boolean'
              ? viewTag.minimizeVideoChat.component.style.float
              : true,
        },
        ...(viewTag?.minimizeVideoChat?.component
          ? omit(viewTag.minimizeVideoChat.component, 'float')
          : undefined),
      }),
      mock.getPopUpComponent({
        popUpView: 'confirmView',
        children: [
          mock.getViewComponent({
            children: [
              mock.getLabelComponent({
                text: 'LEAVING MEETING...',
                style: { display: 'inline' },
              }),
              mock.getLabelComponent({
                text: 'Close this meeting room?',
                style: { display: 'inline' },
              }),
              mock.getLabelComponent({
                text: 'Closing the room will generate a Summary for each participant.',
                style: { display: 'inline' },
              }),
              mock.getLabelComponent({
                text: 'If you desire to return to this meeting, keep this room open',
                display: 'inline',
              }),
              mock.getDividerComponent(),
              mock.getButtonComponent({
                onClick: [
                  mock.getPopUpDismissAction({ popUpView: 'confirmView' }),
                  mock.getEvalObjectAction(),
                  mock.getSaveObjectAction({
                    object: [['roomInfo.response.name', null]],
                  }),
                  mock.getEvalObjectAction(),
                  mock.getGotoObject({ goto: 'MeetingRoomHistory' }),
                  mock.getGotoObject({
                    goto: {
                      dataIn: { destination: 'MeetingRoomHistory' },
                    } as any,
                  }),
                ],
                text: 'Keep Open',
                style: { display: 'inline' },
              }),
              mock.getButtonComponent({
                onClick: [
                  mock.getEvalObjectAction(),
                  mock.getSaveObjectAction({
                    object: [['roomInfo.response.name', null]],
                  }),
                  mock.getEvalObjectAction(),
                  mock.getSaveObjectAction({
                    object: [['roomInfo.response.name', null]],
                  }),
                  mock.getEvalObjectAction(),
                  mock.getGotoObject({ goto: 'MeetingSummary' }),
                ],
                text: 'Close Meeting',
                style: { display: 'inline' },
              }),
              mock.getDividerComponent(),
            ],
          }),
        ],
      }),
      mock.getPopUpComponent({
        popUpView: 'selectView',
        children: [
          mock.getListComponent({
            contentType: 'listObject',
            iteratorVar: 'itemObject',
            listObject: [
              {
                text: 'Meeting Lobby',
                pageName: 'ManageMeeting',
              },
              {
                text: 'Shared Documents',
                pageName: 'UploadSharedDocuments2',
              },
              {
                text: 'Meeting Notes',
                pageName: 'MeetingDocumentsNotes',
              },
              {
                text: 'Share your screen',
                pageName: 'ScreenShare',
              },
            ],
            children: [
              mock.getListItemComponent({
                itemObject: '',
                onClick: [
                  mock.getEvalObjectAction(),
                  mock.getUpdateObjectAction({
                    dataKey: 'VideoChat.popUpListTemp',
                    dataObject: 'itemObject',
                  }),
                  mock.getEvalObjectAction(),
                  mock.getPopUpAction({ popUpView: 'minimizeVideoChat' }),
                ],
                children: [
                  mock.getLabelComponent({ dataKey: 'itemObject.text' }),
                ],
              }),
            ],
          }),
        ],
      }),
    ] as ComponentObject[],
  }

  return pageObject
}

export default getVideoChatPageObject
