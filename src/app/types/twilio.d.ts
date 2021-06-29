import * as tw from 'twilio-video'

/**
 * Mapping from the global Twilio var provided from the twilio-video cdn script
 */
declare module TwilioVideo {
  export type LocalAudioTrack = tw.LocalAudioTrack
  export type LocalDataTrack = tw.LocalDataTrack
  export type LocalVideoTrack = tw.LocalVideoTrack
  export const connect: typeof tw.connect
  export const createLocalTracks: typeof tw.createLocalTracks
  export const createLocalAudioTrack: typeof tw.createLocalAudioTrack
  export const createLocalVideoTrack: typeof tw.createLocalVideoTrack
  export type isSupported = boolean
  export type version = string
}
