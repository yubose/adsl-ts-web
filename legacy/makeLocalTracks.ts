import _ from 'lodash'
import { Viewport } from 'noodl-ui'
import {
  createLocalTracks,
  createLocalAudioTrack,
  createLocalVideoTrack,
  CreateLocalTrackOptions,
  LocalVideoTrack,
  LocalAudioTrack,
  Room,
} from 'twilio-video'

export type AppLocalTracks = ReturnType<typeof makeLocalTracks>

function makeLocalTracks({
  room,
  viewport,
}: {
  room: Room
  viewport: Viewport
}) {
  let _audioTrack: LocalAudioTrack | undefined
  let _videoTrack: LocalVideoTrack | undefined
  let _fetchingLocalTracks = false
  let _getTracksTimeout: NodeJS.Timeout
  let _lastClickTime: number
  let _previousVideoTrackId: string | undefined = ''
  let _publishing = false

  const o = {
    /**
     * Creates and returns local video/audio tracks,
     * This also stores the ids coming from them to the local storage
     * @param { CreateLocalTrackOptions? } options - Options for createLocalTracks
     */
    async getTracks(options?: CreateLocalTrackOptions) {
      try {
        if (_getTracksTimeout) clearTimeout(_getTracksTimeout)
        _getTracksTimeout = setTimeout(() => {
          throw new Error(
            'The request to retrieve your video/audio streams was timed ' +
              'out. Please refresh the page to try again',
          )
        }, 6000)

        const tracks = await createLocalTracks({
          audio: true,
          ...options,
          video: {
            deviceId: _previousVideoTrackId,
            frameRate: 24,
            name: `camera-${Date.now()}`,
            width: viewport.width,
            height: viewport.height,
          },
        })

        clearTimeout(_getTracksTimeout)

        const logMsg = `%c[makeLocalTracks.ts][getTracks] Created local tracks`
        console.log(logMsg, `color:#FF5722;font-weight:bold;`, { room, tracks })

        _videoTrack = (tracks.find((track) => track.kind === 'video') ||
          _videoTrack) as LocalVideoTrack

        _audioTrack = (tracks.find((track) => track.kind === 'audio') ||
          _audioTrack) as LocalAudioTrack

        if (_videoTrack) _previousVideoTrackId = _videoTrack.id

        this.storeLocalTrackIds({
          video: _previousVideoTrackId,
          audio: _audioTrack?.id,
        })

        return tracks
      } catch (error) {
        clearTimeout(_getTracksTimeout)

        const logMsg = `%c[useLocalTracks][getTracks] Error`
        const logStyle = `color:#ec0000;font-weight:bold;`
        console.error(logMsg, logStyle, {
          name: error.name,
          message: error.message,
          code: error.code,
          error,
        })

        window.alert(error.message)
        return
        // if (typeof errorOptions === 'string') {
        //   // Allow them to still join the meeting if they are missing their
        //   const emptyTracks: any[] = []
        //   resolve(emptyTracks)
        // } else {
        //   reject(error)
        // }
      } finally {
        _fetchingLocalTracks = false
      }
    },
    /**
     * Creates and returns a new local audio track
     * @param { string? } deviceId - Previous/current audio track id
     */
    async getLocalAudioTrack(deviceId?: string) {
      const options: CreateLocalTrackOptions = {}
      if (deviceId) {
        options.deviceId = { exact: deviceId }
      }
      _audioTrack = await createLocalAudioTrack(options)
      return _audioTrack
    },
    /**
     * Creates and returns a new local video track
     * @param { CreateLocalTracksOptions } options
     */
    async getLocalVideoTrack(newOptions?: CreateLocalTrackOptions) {
      // Unpublishing the old track and publishing the new track at the same
      // time sometimes causes a conflict when the track name is 'camera',
      // so here we append a timestamp to the track name to avoid the conflict
      _videoTrack = await createLocalVideoTrack({
        frameRate: 24,
        name: `camera-${Date.now()}`,
        deviceId: this.getStoredLocalTrackIds().video,
        ...viewport,
        ...newOptions,
      })
      return _videoTrack
    },
    /** Stops the local video track */
    async removeLocalVideoTrack() {
      if (_videoTrack) {
        _videoTrack.stop()
        _videoTrack = undefined
      }
    },

    /** Returns previously stored track ids from the local storage */
    getStoredLocalTrackIds() {
      let trackIds = window.localStorage.getItem('trackIds')
      if (trackIds) {
        try {
          trackIds = JSON.parse(trackIds)
          return trackIds as { video?: string; audio?: string }
        } catch (error) {
          console.error(error)
        }
      }
      return { video: undefined, audio: undefined }
    },
    /**
     * Stores video/audio track ids to the local storage
     * @param { string } video - Video track ID
     * @param { string } audio - Audio track ID
     */
    storeLocalTrackIds({
      video,
      audio,
    }: { video?: string; audio?: string } = {}) {
      try {
        const prevStoredTrackIds = this.getStoredLocalTrackIds()
        const trackIds = {
          video: video || prevStoredTrackIds.video,
          audio: audio || prevStoredTrackIds.audio,
        }
        window.localStorage.setItem('trackIds', JSON.stringify(trackIds))
      } catch (error) {
        console.error(error)
      }
    },
    /** Toggles the camera on/off (turns the camera screen to black) */
    toggleCamera() {
      if (_videoTrack?.isEnabled !== undefined) {
        if (_videoTrack?.isEnabled) {
          _videoTrack.disable()
        } else {
          _videoTrack.enable()
        }
      } else {
        console.log(
          `%c[makeLocalTracks.ts][toggleCamera] Tried to toggle the camera off but there was no local video track`,
          `color:red;font-weight:bold;`,
          { videoTrack: _videoTrack },
        )
      }
    },
    /** Removes/creates the local video track */
    toggleVideo() {
      console.log(
        `%c[makeLocalTracks.ts][toggleVideo]`,
        `color:green;font-weight:bold;`,
        _videoTrack,
      )

      if (Date.now() - _lastClickTime > 200) {
        _lastClickTime = Date.now()

        if (!_publishing) {
          // Toggle off
          // Removes the video track, local video track, and the video track publication
          if (_videoTrack) {
            console.log(
              `%c[useLocalTracks.tsx][toggleVideo] Toggling camera off`,
              `color:cyan;font-weight:bold;`,
              _videoTrack,
            )

            // Save the current device id so we can re-use when enabling again
            _previousVideoTrackId = _videoTrack?.mediaStreamTrack?.getSettings?.()
              .deviceId
            // videoTrack?.stop()
            const localTrackPublication = room.localParticipant?.unpublishTrack(
              _videoTrack,
            )

            room.localParticipant?.emit(
              'trackUnpublished',
              localTrackPublication,
            )

            this.removeLocalVideoTrack()
          } else {
            console.log(
              `%c[useLocalTracks.tsx][toggleVideo] Toggling camera on`,
              `color:cyan;font-weight:bold;`,
              {
                videoTrack: _videoTrack,
                localParticipant: room.localParticipant,
              },
            )
            // videoTrack?.restart?.()
            _publishing = true
            return this.getLocalVideoTrack({
              deviceId: { exact: _previousVideoTrackId },
            })
              .then((track: LocalVideoTrack) => {
                console.log(
                  `%c[makeLocalTracks.ts][toggleVideo] Retrieved local participant track from getLocalVideoTrack`,
                  `color:cyan;font-weight:bold;`,
                  track,
                )
                // @ts-expect-error
                room.localParticipant?.publishTrack(track, { priority: 'low' })
              })
              .catch((err: Error) => {
                console.error(err)
                window.alert(err.message)
              })
              .finally(() => {
                _publishing = false
              })
          }
        }
      }
    },
  }

  return o
}

export default makeLocalTracks
