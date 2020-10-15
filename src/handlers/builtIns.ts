import _ from 'lodash'
import { Draft } from 'immer'
import {
  ActionChainActionCallback,
  ActionChainActionCallbackOptions,
  getByDataUX,
  getDataValues,
  NOODLBuiltInObject,
  NOODLGotoAction,
} from 'noodl-ui'
import { LocalAudioTrack, LocalVideoTrack } from 'twilio-video'
import { INOODLUiDOM } from 'noodl-ui-dom'
import Page from 'Page'
import Logger from 'logsnap'
import validate from 'utils/validate'
import Meeting from '../meeting'

const log = Logger.create('builtIns.ts')

export type BuiltInFuncName =
  | 'checkUsernamePassword'
  | 'checkVerificationCode'
  | 'enterVerificationCode'
  | 'goBack'
  | 'goto'
  | 'lockApplication'
  | 'logOutOfApplication'
  | 'logout'
  | 'redraw'
  | 'signIn'
  | 'signUp'
  | 'signout'
  | 'toggleCameraOnOff'
  | 'toggleMicrophoneOnOff'
  | 'UploadDocuments'
  | 'UploadFile'
  | 'UploadPhoto'

const createBuiltInActions = function ({
  noodluidom,
  page,
}: {
  noodluidom: INOODLUiDOM
  page: Page
}) {
  // @ts-expect-error
  const builtInActions: Record<
    BuiltInFuncName,
    ActionChainActionCallback<NOODLBuiltInObject>
  > = {}

  // Called on signin + signup
  builtInActions.checkVerificationCode = async (action) => {}

  // Called after uaser fills out the form in CreateNewAccount and presses Submit
  builtInActions.checkUsernamePassword = (action, { abort }: any) => {
    // dispatchRedux(mergeCacheAuthValues(dataValues))
    const { password, confirmPassword } = getDataValues()
    if (password !== confirmPassword) {
      window.alert('Your passwords do not match')
      abort('Passwords do not match')
    }
    abort('Creating account')
  }

  // Called when user enters their verification code in the popup and clicks submit
  builtInActions.enterVerificationCode = async (action, options) => {
    log.func('enterVerificationCode').red('', _.assign({ action }, options))
    // if (/SignUp/.test(location.pathname)) await signup?.onSubmit()
    // else await signin?.onSubmit()
  }

  builtInActions.goBack = () => {
    let { previousPage } = page
    if (!previousPage) {
      // Hard code this for now until routing is implemented
      let cachedPages: any = window.localStorage.getItem('CACHED_PAGES')
      if (cachedPages) {
        try {
          cachedPages = JSON.parse(cachedPages)
          if (Array.isArray(cachedPages)) {
            let pg: string
            while (cachedPages.length) {
              pg = cachedPages.shift()?.name || ''
              if (pg && pg !== page.currentPage && pg !== page.previousPage) {
                log.green(`Updated previous page: ${page.previousPage}`)
                previousPage = pg
                break
              }
            }
          }
        } catch (error) {
          console.error(error)
        }
      }
    }
    if (previousPage) {
      page.requestPageChange(previousPage)
    } else {
      log.func('goBack')
      log.red(
        'Tried to navigate to a previous page but a previous page could not ' +
          'be found',
        { previousPage: page.previousPage, currentPage: page.currentPage },
      )
    }
  }

  builtInActions.goto = async (action: NOODLGotoAction, options) => {
    log.func('goto')
    log.red('', _.assign({ action }, options))
    // URL
    if (_.isString(action)) {
      page.requestPageChange(action)
    } else if (_.isPlainObject(action)) {
      // Currently don't know of any known properties the goto syntax has.
      // We will support a "destination" key since it exists on goto which will
      // soon be deprecated by this goto action
      if (action.destination) {
        page.requestPageChange(action.destination)
      } else {
        log.func('goto')
        log.red(
          'Tried to go to a page but could not find information on the whereabouts',
          _.assign({ action }, options),
        )
      }
    }
  }

  /** Shared common logic for both lock/logout logic */
  const _onLockLogout = async () => {
    const dataValues = getDataValues() as { password: string }
    const hiddenPwLabel = getByDataUX('passwordHidden') as HTMLDivElement
    let password = dataValues.password || ''
    // Reset the visible status since this is a new attempt
    if (hiddenPwLabel) {
      const isVisible = hiddenPwLabel.style.visibility === 'visible'
      if (isVisible) hiddenPwLabel.style.visibility = 'hidden'
    }
    // Validate the syntax of their password first
    const errMsg = validate.password(password)
    if (errMsg) {
      window.alert(errMsg)
      return 'abort'
    }
    // Validate if their password is correct or not
    const { Account } = await import('@aitmed/cadl')
    const isValid = Account.verifyUserPassword(password)
    if (!isValid) {
      console.log(`%cisValid ?`, 'color:#e74c3c;font-weight:bold;', isValid)
      if (hiddenPwLabel) hiddenPwLabel.style.visibility = 'visible'
      else window.alert('Password is incorrect')
      return 'abort'
    } else {
      if (hiddenPwLabel) hiddenPwLabel.style.visibility = 'hidden'
    }
  }

  builtInActions.lockApplication = async (action, options) => {
    const result = await _onLockLogout()
    if (result === 'abort') return 'abort'
    const { Account } = await import('@aitmed/cadl')
    await Account.logout(false)
    window.location.reload()
  }

  builtInActions.logOutOfApplication = async (action, options) => {
    const result = await _onLockLogout()
    if (result === 'abort') return 'abort'
    const { Account } = await import('@aitmed/cadl')
    await Account.logout(true)
    window.location.reload()
  }

  builtInActions.logout = async () => {
    const { Account } = await import('@aitmed/cadl')
    await Account.logout(true)
    window.location.reload()
  }

  builtInActions.redraw = async (action, { component }) => {
    const { viewTag } = action
    // Re-render the current list item somehow
  }

  builtInActions.signIn = async (action, options) => {}
  builtInActions.signUp = async () => {}
  builtInActions.signout = async () => {}

  builtInActions.toggleCameraOnOff = async () => {
    log.func('toggleCameraOnOff')

    let localParticipant = Meeting.localParticipant
    let videoTrack: LocalVideoTrack | undefined

    if (localParticipant) {
      videoTrack = Array.from(localParticipant.tracks.values()).find(
        (trackPublication) => trackPublication.kind === 'video',
      )?.track as LocalVideoTrack

      if (videoTrack) {
        if (videoTrack.isEnabled) {
          videoTrack.disable()
          log.grey(`Toggled video OFF for LocalParticipant`, localParticipant)
        } else {
          videoTrack.enable()
          log.grey(`Toggled video ON for LocalParticipant`, localParticipant)
        }
      } else {
        log.red(
          `Tried to toggle video track on/off for LocalParticipant but a video track was not available`,
          { localParticipant, room: Meeting.room },
        )
      }
    }
  }

  builtInActions.toggleMicrophoneOnOff = async () => {
    log.func('toggleMicrophoneOnOff')

    let localParticipant = Meeting.localParticipant
    let audioTrack: LocalAudioTrack | undefined

    if (localParticipant) {
      audioTrack = Array.from(localParticipant.tracks.values()).find(
        (trackPublication) => trackPublication.kind === 'audio',
      )?.track as LocalAudioTrack

      if (audioTrack) {
        if (audioTrack.isEnabled) {
          audioTrack.disable()
          log.grey(`Toggled audio OFF for LocalParticipant`, localParticipant)
        } else {
          log.grey(`Toggled audio ON for LocalParticipant`, localParticipant)
          audioTrack.enable()
        }
      }
    }
  }

  builtInActions.UploadFile = (action, options) => {
    log.func('UploadFile')
    log.grey('', { action, ...options })

    const input = document.createElement('input')
    input.type = 'file'
    // TODO: string files
    input.onchange = async (e: any) => {
      let file = e.target?.files?.[0]
      let title = file?.name || ''
      let dataValues = getDataValues<{ title: string }, 'title'>()

      const params: {
        title: string
        content: File | Blob
      } = { content: file, title: dataValues.title } as {
        title: string
        content: File | Blob
      }

      if (dataValues.title) {
        log.func('UploadFile')
        log.grey('Values', params)
        console.log(
          `%c[useBuiltInActions.tsx][builtIn -- UploadPhoto] Values`,
          `color:#FF5722;font-weight:bold;`,
          params,
        )

        const nameFieldPath = ''

        const { default: noodl } = await import('app/noodl')

        const pageName = options.context?.page?.name || ''

        noodl.editDraft((draft: Draft<any>) => {
          _.set(draft?.[pageName], nameFieldPath, file)
        })

        log.func('UploadFile')
        log.green(
          `Attached the Blob/File "${title}" of type "${file?.type}" on ` +
            `root.${pageName}.${nameFieldPath}`,
          file,
        )
      }
    }
    input.click()
  }

  builtInActions.UploadPhoto = builtInActions.UploadFile
  builtInActions.UploadDocuments = builtInActions.UploadFile

  return builtInActions
}

/* -------------------------------------------------------
  ---- Built in funcs below are for the SDK
-------------------------------------------------------- */

// This goes on the SDK
export function onVideoChatBuiltIn({
  joinRoom,
}: {
  joinRoom: (token: string) => Promise<any>
}) {
  return async function onVideoChat(
    action: NOODLBuiltInObject & {
      roomId: string
      accessToken: string
    },
  ) {
    try {
      if (action) {
        let msg = ''
        if (action.accessToken) msg += 'Received access token '
        if (action.roomId) msg += 'and room id'
        log.func('onVideoChat').grey(msg, action)
      } else {
        log.func('onVideoChat')
        log.red(
          'Expected an action object but the value passed in was null or undefined',
          action,
        )
      }

      // Disconnect from the room if for some reason we
      // are still connected to one
      // if (room.state === 'connected' || room.state === 'reconnecting') {
      //   room?.disconnect?.()
      //   if (connecting) setConnecting(false)
      // }
      if (action?.roomId) log.grey(`Connecting to room id: ${action.roomId}`)
      const newRoom = await joinRoom(action.accessToken)
      if (newRoom) {
        log.func('onVideoChat')
        log.green(`Connected to room: ${newRoom.name}`, newRoom)
      } else {
        log.func('onVideoChat')
        log.red(
          `Expected a room instance to be returned but received null or undefined instead`,
          newRoom,
        )
      }
    } catch (error) {
      console.error(error)
    }
  }
}

export function onBuiltinMissing(
  action: NOODLBuiltInObject,
  options: ActionChainActionCallbackOptions,
) {
  window.alert(`The button "${action.funcName}" is not available to use yet`)
}

export default createBuiltInActions
