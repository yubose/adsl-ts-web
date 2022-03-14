import * as u from '@jsmanifest/utils'
import { EventEmitter } from 'events'
import {
  LocalTrack,
  LocalAudioTrackPublication,
  LocalTrackPublication,
  LocalVideoTrackPublication,
  RemoteAudioTrackPublication,
  RemoteVideoTrackPublication,
  Track,
  TrackPublication,
  RemoteTrackPublication,
  RemoteTrack,
} from 'twilio-video'
import {
  LocalAudioTrack,
  LocalVideoTrack,
  RemoteAudioTrack,
} from 'twilio-video'
import { getRandomKey } from '../../../utils/common'
import {
  createMockAudioTrack,
  createMockVideoTrack,
  getMockLocalAudioTrack,
  getMockLocalVideoTrack,
  getMockRemoteAudioTrack,
  getMockRemoteVideoTrack,
  MockAudioTrack,
  MockLocalAudioTrack,
  MockLocalVideoTrack,
  MockRemoteAudioTrack,
  MockTrack,
  MockVideoTrack,
  MockRemoteVideoTrack,
} from './track'

export class MockTrackPublication
  extends EventEmitter
  implements TrackPublication
{
  isEnabled: boolean
  kind: Track.Kind
  trackName: string
  trackSid: Track.SID

  constructor({
    kind,
    isEnabled = false,
    trackName = '',
    trackSid = getRandomKey(),
  }: {
    kind: Track.Kind
    isEnabled?: boolean
    trackName?: string
    trackSid?: string
  }) {
    super()
    this.kind = kind
    this.isEnabled = isEnabled
    this.trackName = trackName
    this.trackSid = trackSid
  }
}

export class MockLocalTrackPublication
  extends EventEmitter
  implements LocalTrackPublication
{
  isEnabled = false
  isTrackEnabled = false
  track: MockLocalAudioTrack
  trackName = ''
  trackSid = ''
  kind: Track.Kind
  priority: Track.Priority

  constructor({
    kind,
    priority = 'standard',
    track = {} as MockLocalAudioTrack,
    trackSid = getRandomKey(),
  }: {
    kind: Track.Kind
    priority?: Track.Priority
    track?: MockLocalAudioTrack
    trackSid?: string
  }) {
    super()
    this.kind = kind
    this.priority = priority
    this.track =
      kind == 'audio'
        ? createMockAudioTrack(track)
        : createMockVideoTrack(track)
    this.trackSid = trackSid
  }

  setPriority(priority: Track.Priority): this {
    return this
  }

  unpublish(): this {
    return this
  }
}

export class MockRemoteTrackPublication
  extends EventEmitter
  implements RemoteTrackPublication
{
  isEnabled = false
  isTrackEnabled = false
  isSubscribed: boolean
  track: RemoteTrack
  trackName = ''
  trackSid = ''
  kind: Track.Kind
  publishPriority: Track.Priority

  constructor({
    kind,
    isEnabled = false,
    isSubscribed = false,
    isTrackEnabled = false,
    publishPriority = 'standard',
    track = {} as RemoteTrack,
    trackSid = getRandomKey(),
  }: {
    kind: Track.Kind
    isEnabled?: boolean
    isSubscribed?: boolean
    isTrackEnabled?: boolean
    publishPriority?: Track.Priority
    track?: RemoteTrack
    trackSid?: string
  }) {
    super()
    this.kind = kind
    this.isEnabled = isEnabled
    this.isSubscribed = isSubscribed
    this.isTrackEnabled = isTrackEnabled
    this.publishPriority = publishPriority
    this.track =
      kind === 'audio'
        ? createMockAudioTrack(track)
        : createMockVideoTrack(track)
    this.trackSid = trackSid
  }

  setPriority(priority: Track.Priority): this {
    return this
  }

  unpublish(): this {
    return this
  }
}

export class MockLocalAudioTrackPublication
  extends EventEmitter
  implements LocalAudioTrackPublication
{
  kind = 'audio' as const
  isEnabled: boolean
  isTrackEnabled: boolean
  priority: Track.Priority
  track: MockLocalAudioTrack
  trackName: string
  trackSid: string

  constructor({
    track = {} as MockLocalAudioTrack,
    ...rest
  }: {
    track?: MockLocalAudioTrack
    isEnabled?: boolean
    isTrackEnabled?: boolean
    priority?: Track.Priority
    trackName?: string
    trackSid?: string
  } = {}) {
    super()
    this.track = track
    this.isEnabled = !!rest.isEnabled
    this.isTrackEnabled = !!rest.isTrackEnabled
    this.priority = rest.priority || 'standard'
    this.trackName = rest.trackName || ''
    this.trackSid = rest.trackSid || u.getRandomKey()
  }

  setPriority(priority: Track.Priority): this {
    return this
  }

  unpublish(): this {
    return this
  }
}

export class MockLocalVideoTrackPublication
  extends EventEmitter
  implements LocalVideoTrackPublication
{
  kind = 'video' as const
  track: MockLocalVideoTrack
  isEnabled: boolean
  isTrackEnabled: boolean
  trackName: string
  trackSid: string
  priority: Track.Priority = 'standard'

  constructor({
    track = {} as MockLocalVideoTrack,
    isEnabled = false,
    isTrackEnabled = false,
    trackName = '',
    trackSid = u.getRandomKey(),
  }: {
    track?: MockLocalVideoTrack
    isEnabled?: boolean
    isTrackEnabled?: boolean
    trackName?: string
    trackSid?: string
  } = {}) {
    super()
    this.track = track
    this.isEnabled = !!isEnabled
    this.isTrackEnabled = !!isTrackEnabled
    this.trackName = trackName
    this.trackSid = trackSid
  }

  setPriority(priority: Track.Priority): this {
    return this
  }

  unpublish(): this {
    return this
  }
}

export class MockRemoteAudioTrackPublication
  extends EventEmitter
  implements RemoteAudioTrackPublication
{
  kind = 'audio' as const
  track: RemoteAudioTrack
  isEnabled: boolean
  isSubscribed: boolean
  isTrackEnabled: boolean
  publishPriority: Track.Priority = 'standard'
  trackName: string
  trackSid: string

  constructor({
    track = {} as RemoteAudioTrack,
    isEnabled = false,
    isSubscribed = false,
    isTrackEnabled = false,
    trackName = '',
    trackSid = u.getRandomKey(),
  }: {
    track?: RemoteAudioTrack
    isEnabled?: boolean
    isSubscribed?: boolean
    isTrackEnabled?: boolean
    trackName?: string
    trackSid?: string
  }) {
    super()
    this.track = track
    this.isEnabled = isEnabled
    this.isSubscribed = isSubscribed
    this.isTrackEnabled = isTrackEnabled
    this.trackName = trackName
    this.trackSid = trackSid
  }
}

export class MockRemoteVideoTrackPublication
  extends EventEmitter
  implements RemoteVideoTrackPublication
{
  kind = 'video' as const
  track: MockRemoteVideoTrack
  isEnabled: boolean
  isSubscribed: boolean
  isTrackEnabled: boolean
  publishPriority: Track.Priority = 'standard'
  trackName: string
  trackSid: string

  constructor({
    track = {} as MockRemoteVideoTrack,
    isEnabled = false,
    isSubscribed = false,
    isTrackEnabled = false,
    trackName = '',
    trackSid = u.getRandomKey(),
  }: {
    track?: MockRemoteVideoTrack
    isEnabled?: boolean
    isSubscribed?: boolean
    isTrackEnabled?: boolean
    trackName?: string
    trackSid?: string
  } = {}) {
    super()
    this.isEnabled = isEnabled
    this.isSubscribed = isSubscribed
    this.isTrackEnabled = isTrackEnabled
    this.track = track
    this.trackName = trackName
    this.trackSid = trackSid
  }
}

export type MockAudioTrackPublication =
  | MockLocalAudioTrackPublication
  | MockRemoteAudioTrackPublication

export type MockVideoTrackPublication =
  | MockLocalVideoTrackPublication
  | MockRemoteVideoTrackPublication

export function getTrackOptions(kind: Track.Kind, options?: any) {
  return { kind, ...options }
}

export function getTrackPublicationOptions(args: {
  isLocal?: boolean
  kind: Track.Kind
  isSubscribed?: boolean
  isTrackEnabled?: boolean
  priority?: Track.Priority
  name?: string
  sid?: string
}) {
  const { isLocal = true } = args
  const track = getTrackOptions(args.kind)
  const options = {
    kind: args.kind,
    isTrackEnabled: !!args.isTrackEnabled,
    trackName: args.name || '',
    trackSid: args.sid || getRandomKey(),
  } as Record<string, any>

  if (isLocal) {
    if (args.kind === 'audio') {
      options.priority = args.priority || 'standard'
    }
  } else {
    options.isSubscribed = !!args.isSubscribed
    options.publishPriority = args.priority || 'standard'
  }

  return { ...options, track }
}

export function createMockTrackPublication(
  kind: Track.Kind,
  opts: Partial<ConstructorParameters<typeof MockTrackPublication>[0]> & {
    isLocal: boolean
  },
): MockLocalTrackPublication | MockRemoteTrackPublication

export function createMockTrackPublication(
  opts?: Partial<ConstructorParameters<typeof MockTrackPublication>[0]> & {
    isLocal?: boolean
  },
): MockLocalTrackPublication | MockRemoteTrackPublication

export function createMockTrackPublication(arg1: any, arg2?: any) {
  let props = {} as ConstructorParameters<typeof MockTrackPublication>[0]
  if (u.isStr(arg1)) props.kind = arg1 as Track.Kind
  if (u.isObj(arg1)) props = { ...props, ...arg1 }
  if (u.isObj(arg2)) props = { ...props, ...arg2 }
  if (u.isObj(arg1) && arg1.isLocal) {
    return new MockRemoteTrackPublication(props)
  }
  return new MockLocalTrackPublication(props)
}

export function createMockLocalTrackPublication(
  ...args: Parameters<typeof createMockTrackPublication>
): MockLocalTrackPublication {
  args = [...args]
  if (u.isStr(args[0])) {
    return createMockTrackPublication({
      kind: args[0] as Track.Kind,
      // @ts-expect-error
      ...(args[1] || {}),
      isLocal: true,
    }) as MockLocalTrackPublication
  }
  return createMockTrackPublication(...args) as MockLocalTrackPublication
}

export function createMockRemoteTrackPublication(
  ...args: Parameters<typeof createMockTrackPublication>
): MockRemoteTrackPublication {
  args = [...args]
  if (u.isStr(args[0])) {
    return createMockTrackPublication({
      kind: args[0] as Track.Kind,
      // @ts-expect-error
      ...(args[1] || {}),
      isLocal: false,
    }) as MockRemoteTrackPublication
  }
  return createMockTrackPublication(...args) as MockRemoteTrackPublication
}

export function createAudioTracks(
  trackPublication?: Track.SID | MockAudioTrackPublication,
) {
  if (!trackPublication) {
    trackPublication = createMockTrackPublication(
      getTrackOptions('audio'),
    ) as MockAudioTrackPublication
  } else if (u.isStr(trackPublication)) {
    trackPublication = createMockTrackPublication(
      getTrackOptions('audio', { trackSid: trackPublication }),
    ) as MockAudioTrackPublication
  }
  const audioTracks = new Map()
  audioTracks.set(trackPublication?.trackSid, trackPublication)
  return audioTracks as Map<Track.SID, MockAudioTrackPublication>
}

export function createVideoTracks(
  trackPublication?: Track.SID | MockVideoTrackPublication,
) {
  if (!trackPublication) {
    trackPublication = createMockTrackPublication(
      getTrackOptions('video'),
    ) as MockVideoTrackPublication
  } else if (u.isStr(trackPublication)) {
    trackPublication = createMockTrackPublication(
      getTrackOptions('video', {
        trackSid: trackPublication,
      }),
    ) as MockVideoTrackPublication
  }
  const videoTracks = new Map()
  videoTracks.set(trackPublication?.trackSid, trackPublication)
  return videoTracks as Map<Track.SID, MockVideoTrackPublication>
}
