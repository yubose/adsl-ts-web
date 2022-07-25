import * as u from '@jsmanifest/utils'
import { EventEmitter } from 'events'
import { VideoTrack, Track, VideoProcessor, AudioTrack } from 'twilio-video'
import {
  LocalAudioTrack,
  RemoteAudioTrack,
  RemoteVideoTrack,
} from 'twilio-video'
import { VideoContentPreferences } from 'twilio-video/tsdef/RemoteVideoTrack'

const VIDEO_DIMENSIONS = { width: 1024, height: 768 }

export class MockTrack extends EventEmitter implements Track {
  kind: Track.Kind
  name: string

  constructor({ kind, name = '' }: { kind: Track.Kind; name?: string }) {
    super()
    this.kind = kind
    this.name = name
  }
}

export class MockAudioTrack extends MockTrack implements AudioTrack {
  kind = 'audio' as const
  isEnabled: boolean
  isStarted: boolean
  mediaStreamTrack: MediaStreamTrack

  constructor(options?: {
    isEnabled?: boolean
    isStarted?: boolean
    mediaStreamTrack?: MediaStreamTrack
    name?: string
  }) {
    super({ kind: 'audio', name: options?.name || '' })
    this.isEnabled = !!options?.isEnabled
    this.isStarted = !!options?.isStarted
    this.mediaStreamTrack = options?.mediaStreamTrack || new MediaStreamTrack()
  }

  attach(element?: string | HTMLMediaElement): HTMLMediaElement {
    return new HTMLMediaElement()
  }

  detach(element?: string | HTMLMediaElement): HTMLMediaElement[] {
    return [new HTMLMediaElement()]
  }

  stop(): this {
    return this
  }

  restart() {
    return Promise.resolve()
  }
}

export class MockVideoTrack extends MockTrack implements VideoTrack {
  kind = 'video' as const
  dimensions: any
  isEnabled: boolean
  isStarted: boolean
  mediaStreamTrack: MediaStreamTrack
  processor: VideoProcessor | null = null
  processedTrack: MediaStreamTrack | null = null

  constructor(options?: {
    isEnabled?: boolean
    isStarted?: boolean
    mediaStreamTrack?: MediaStreamTrack
    name?: string
  }) {
    super({ kind: 'video', name: options?.name || '' })
    this.isEnabled = !!options?.isEnabled
    this.isStarted = !!options?.isStarted
    this.mediaStreamTrack = options?.mediaStreamTrack || new MediaStreamTrack()
  }

  attach(element?: string | HTMLMediaElement): HTMLVideoElement {
    return new HTMLVideoElement()
  }

  detach(element?: string | HTMLMediaElement): HTMLVideoElement[] {
    return [new HTMLVideoElement()]
  }

  addProcessor(processor: VideoProcessor): this {
    return this
  }

  removeProcessor(processor: VideoProcessor): this {
    return this
  }

  stop(): this {
    return this
  }

  restart() {
    return this
  }
}

export class MockLocalAudioTrack
  extends EventEmitter
  implements LocalAudioTrack
{
  id: string
  kind = 'audio' as const
  isStarted: boolean
  isEnabled: boolean
  isStopped: boolean
  mediaStreamTrack: MediaStreamTrack
  name: string

  constructor({
    isStarted = false,
    isStopped = false,
    isEnabled = false,
    mediaStreamTrack = {} as MediaStreamTrack,
    name = '',
    id = u.getRandomKey(),
  }: {
    isStarted?: boolean
    isStopped?: boolean
    isEnabled?: boolean
    mediaStreamTrack?: MediaStreamTrack
    name?: string
    id?: string
  } = {}) {
    super()
    this.id = id
    this.isStarted = isStarted
    this.isStopped = isStopped
    this.isEnabled = isEnabled
    this.mediaStreamTrack = mediaStreamTrack
    this.name = name
  }

  attach(element?: string | HTMLMediaElement): HTMLMediaElement {
    return new HTMLMediaElement()
  }
  detach(element?: string | HTMLMediaElement): HTMLMediaElement[] {
    return [new HTMLMediaElement()]
  }

  enable(enabled?: boolean): this {
    return this
  }

  disable(): this {
    return this
  }

  stop(): this {
    return this
  }

  restart(constraints?: MediaTrackConstraints) {
    return Promise.resolve()
  }
}

export class MockLocalVideoTrack extends MockTrack implements VideoTrack {
  dimensions: VideoTrack.Dimensions
  kind = 'video' as const
  isStarted: boolean
  isEnabled: boolean
  mediaStreamTrack: MediaStreamTrack
  processor: VideoProcessor
  processedTrack: MediaStreamTrack | null = null

  constructor({
    isStarted = false,
    isEnabled = false,
    mediaStreamTrack = {} as MediaStreamTrack,
    name = '',
  }: {
    isStarted?: boolean
    isEnabled?: boolean
    mediaStreamTrack?: MediaStreamTrack
    name?: string
  } = {}) {
    super({ kind: 'video', name })
    this.dimensions = { width: 1024, height: 768 }
    this.mediaStreamTrack = mediaStreamTrack
    this.name = name
    this.processor = { processFrame: () => {} }
    this.isStarted = isStarted
    this.isEnabled = isEnabled
  }

  attach(element?: string | HTMLMediaElement): HTMLVideoElement {
    return new HTMLVideoElement()
  }

  detach(element?: string | HTMLMediaElement): HTMLVideoElement[] {
    return [new HTMLVideoElement()]
  }

  addProcessor(processor: VideoProcessor): this {
    return this
  }

  removeProcessor(processor: VideoProcessor): this {
    return this
  }
}

export class MockRemoteAudioTrack
  extends MockTrack
  implements RemoteAudioTrack
{
  kind = 'audio' as const
  isSwitchedOff: boolean
  isEnabled: boolean
  isStarted: boolean
  mediaStreamTrack: MediaStreamTrack
  priority: Track.Priority | null = null
  sid: string

  constructor({
    name = '',
    isEnabled = false,
    isStarted = false,
    isSwitchedOff = false,
    sid = u.getRandomKey(),
  }: {
    name?: string
    isSwitchedOff?: boolean
    isEnabled?: boolean
    isStarted?: boolean
    sid?: string
  }) {
    super({ kind: 'audio', name })
    this.isEnabled = isEnabled
    this.isStarted = isStarted
    this.isSwitchedOff = isSwitchedOff
    this.mediaStreamTrack = new MediaStreamTrack()
    this.sid = sid
  }

  attach(element?: string | HTMLMediaElement): HTMLMediaElement {
    return new HTMLMediaElement()
  }

  detach(element?: string | HTMLMediaElement): HTMLMediaElement[] {
    return [new HTMLMediaElement()]
  }

  setPriority(priority: Track.Priority | null): this {
    return this
  }
}

export class MockRemoteVideoTrack
  extends MockTrack
  implements RemoteVideoTrack
{
  kind = 'video' as const
  dimensions: VideoTrack.Dimensions
  isStarted: boolean
  isEnabled: boolean
  isSwitchedOff: boolean
  mediaStreamTrack: MediaStreamTrack
  priority: Track.Priority | null = null
  processor: VideoProcessor | null = null
  processedTrack: MediaStreamTrack | null = null
  sid: string

  constructor({
    dimensions = VIDEO_DIMENSIONS,
    isStarted = false,
    isEnabled = false,
    isSwitchedOff = false,
    mediaStreamTrack = new MediaStreamTrack() as MediaStreamTrack,
    name = '',
    sid = u.getRandomKey(),
  }: {
    dimensions?: VideoTrack.Dimensions
    isStarted?: boolean
    isEnabled?: boolean
    isSwitchedOff?: boolean
    mediaStreamTrack?: MediaStreamTrack
    name?: string
    sid?: string
  }) {
    super({ kind: 'video', name })
    this.dimensions = dimensions
    this.isEnabled = isEnabled
    this.isStarted = isStarted
    this.isSwitchedOff = isSwitchedOff
    this.mediaStreamTrack = mediaStreamTrack
    this.sid = sid
  }

  attach(element?: string | HTMLMediaElement): HTMLVideoElement {
    return new HTMLVideoElement()
  }

  detach(element?: string | HTMLMediaElement): HTMLVideoElement[] {
    return [new HTMLVideoElement()]
  }

  addProcessor(processor: VideoProcessor): this {
    return this
  }

  removeProcessor(processor: VideoProcessor): this {
    return this
  }

  setContentPreferences(content: VideoContentPreferences): this {
    return this
  }

  setPriority(priority: Track.Priority | null): this {
    return this
  }

  switchOn(): this {
    return this
  }

  switchOff(): this {
    return this
  }
}

/* -------------------------------------------------------
  ---- LOCAL PARTICIPANT
-------------------------------------------------------- */

export function getMockLocalAudioTrack(
  opts?: string | ConstructorParameters<typeof MockLocalAudioTrack>[0],
) {
  const props = {} as Extract<typeof opts, object>
  if (u.isStr(opts)) opts = { id: opts }
  else u.assign(props, opts)
  if (!props.id) props.id = u.getRandomKey()
  return new MockLocalAudioTrack(props)
}

export function getMockLocalVideoTrack(
  opts?: ConstructorParameters<typeof MockLocalVideoTrack>[0],
) {
  return new MockLocalVideoTrack(opts)
}

/* -------------------------------------------------------
  ---- REMOTE PARTICIPANT
-------------------------------------------------------- */

export function getMockRemoteAudioTrack(
  opts?: string | ConstructorParameters<typeof MockRemoteAudioTrack>[0],
): MockRemoteAudioTrack {
  const props = {} as Extract<typeof opts, object>
  if (u.isStr(opts)) opts = { sid: opts }
  else u.assign(props, opts)
  if (!props.sid) props.sid = u.getRandomKey()
  return new MockRemoteAudioTrack(props)
}

export function getMockRemoteVideoTrack(
  opts?: string | ConstructorParameters<typeof MockRemoteVideoTrack>[0],
): MockRemoteVideoTrack {
  const props = {} as Extract<typeof opts, object>
  if (u.isStr(opts)) opts = { sid: opts }
  else u.assign(props, opts)
  if (!props.sid) props.sid = u.getRandomKey()
  return new MockRemoteVideoTrack(props)
}

export interface CreateMockTrackOptions {
  kind?: Track.Kind
  name?: string
}

export function createMockAudioTrack(options: CreateMockTrackOptions) {
  const audioTrack = new MockAudioTrack(options)
  return audioTrack
}

export function createMockVideoTrack(options: CreateMockTrackOptions) {
  const videoTrack = new MockVideoTrack(options)
  return videoTrack
}
