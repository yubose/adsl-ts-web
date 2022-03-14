import * as u from '@jsmanifest/utils'
import { EventEmitter } from 'events'
import {
  EncodingParameters,
  LocalTrack,
  LocalAudioTrackPublication,
  LocalDataTrackPublication,
  LocalParticipant,
  LocalTrackPublication,
  LocalTrackPublishOptions,
  LocalVideoTrackPublication,
  MediaStreamTrackPublishOptions,
  NetworkQualityConfiguration,
  NetworkQualityStats,
  RemoteAudioTrackPublication,
  RemoteVideoTrackPublication,
  RemoteParticipant,
  Track,
  TrackPublication,
  VideoTrackPublication,
  Participant,
  AudioTrackPublication,
  DataTrackPublication,
  RemoteDataTrackPublication,
  RemoteTrackPublication,
} from 'twilio-video'
import { getRandomKey } from '../../../utils/common'
import { MockLocalTrackPublication } from './trackPublication'

export class MockParticipant extends EventEmitter implements Participant {
  identity: Participant.Identity
  audioTracks: Map<string, AudioTrackPublication>
  dataTracks: Map<string, DataTrackPublication>
  videoTracks: Map<string, VideoTrackPublication>
  networkQualityLevel: number | null
  networkQualityStats: NetworkQualityStats | null
  sid: string
  state: string
  tracks: Map<string, TrackPublication>

  constructor({
    audioTracks = new Map(),
    dataTracks = new Map(),
    videoTracks = new Map(),
    tracks = new Map(),
    sid = getRandomKey(),
    ...options
  }: Partial<MockParticipant> = {}) {
    super()
    this.identity = options.identity as this['identity']
    this.audioTracks = audioTracks
    this.dataTracks = dataTracks
    this.videoTracks = videoTracks
    this.networkQualityLevel =
      options.networkQualityLevel as this['networkQualityLevel']
    this.networkQualityStats =
      options.networkQualityStats as this['networkQualityStats']
    this.sid = sid
    this.state = options.state as this['state']
    this.tracks = tracks
  }
}

export class MockLocalParticipant
  extends EventEmitter
  implements LocalParticipant
{
  audioTracks: Map<Track.SID, LocalAudioTrackPublication>
  dataTracks: Map<Track.SID, LocalDataTrackPublication>
  tracks: Map<Track.SID, LocalTrackPublication>
  videoTracks: Map<Track.SID, LocalVideoTrackPublication>
  sid: string
  signalingRegion = ''
  identity: string
  networkQualityLevel: number | null = 5
  networkQualityStats: NetworkQualityStats | null = null
  state = 'IDLE'

  constructor(
    options?: Partial<
      Pick<
        MockParticipant,
        | 'audioTracks'
        | 'dataTracks'
        | 'videoTracks'
        | 'tracks'
        | 'sid'
        | 'identity'
      >
    >,
  ) {
    super({})
    this.audioTracks = options?.audioTracks as this['audioTracks']
    this.dataTracks = options?.dataTracks as this['dataTracks']
    this.videoTracks = options?.videoTracks as this['videoTracks']
    this.identity = options?.identity || u.getRandomKey()
    this.tracks = options?.tracks as this['tracks']
    this.sid = options?.sid || getRandomKey()
  }

  async publishTrack(
    track: LocalTrack,
    options?: LocalTrackPublishOptions,
  ): Promise<LocalTrackPublication>
  async publishTrack(
    track: MediaStreamTrack,
    options?: MediaStreamTrackPublishOptions,
  ): Promise<LocalTrackPublication>
  async publishTrack(
    track: any,
    options?: any,
  ): Promise<import('twilio-video').LocalTrackPublication> {
    return new MockLocalTrackPublication({ track })
  }

  async publishTracks(
    tracks: (LocalTrack | MediaStreamTrack)[],
  ): Promise<LocalTrackPublication[]> {
    const publications = [new MockLocalTrackPublication({ kind: 'audio' })]
    return publications
  }

  setParameters(encodingParameters?: EncodingParameters | null): this {
    return this
  }

  setNetworkQualityConfiguration(
    networkQualityConfiguration: NetworkQualityConfiguration,
  ): this {
    return this
  }

  unpublishTrack(
    track: LocalTrack | MediaStreamTrack,
  ): LocalTrackPublication | null {
    return null
  }

  unpublishTracks(
    tracks: (LocalTrack | MediaStreamTrack)[],
  ): LocalTrackPublication[] {
    return []
  }
}

export class MockRemoteParticipant
  extends EventEmitter
  implements RemoteParticipant
{
  audioTracks: Map<Track.SID, RemoteAudioTrackPublication>
  dataTracks: Map<Track.SID, RemoteDataTrackPublication>
  tracks: Map<Track.SID, RemoteTrackPublication>
  videoTracks: Map<Track.SID, RemoteVideoTrackPublication>
  identity: string = ''
  networkQualityLevel: number | null = null
  networkQualityStats: NetworkQualityStats | null = null
  sid: string = ''
  state: string = ''

  constructor(
    options?: Partial<
      Pick<Participant, 'audioTracks' | 'dataTracks' | 'tracks' | 'videoTracks'>
    > & { sid?: string; state?: string },
  ) {
    super({})
    this.audioTracks = options?.audioTracks as this['audioTracks']
    this.dataTracks = options?.dataTracks as this['dataTracks']
    this.videoTracks = options?.videoTracks as this['videoTracks']
    this.tracks = options?.tracks as this['tracks']
    this.sid = options?.sid as string
  }
}

export function getTrackOptions(kind: Track.Kind, options?: any) {
  return { kind, ...options }
}

export function getTrackPublicationOptions(args: {
  isLocal: boolean
  kind: Track.Kind
  isSubscribed?: boolean
  isTrackEnabled?: boolean
  priority?: Track.Priority
  name?: string
  sid?: string
}) {
  const { isLocal } = args
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

export interface GetMockParticipantArgsOptions {
  audioTracks?: Record<string, any>
  videoTracks?: Record<string, any>
  identity?: string
  networkQualityLevel?: number
  networkQualityStats?: NetworkQualityStats
  sid?: string
}

export function getMockParticipantArgs(sid?: string): any
export function getMockParticipantArgs(
  options?: GetMockParticipantArgsOptions,
): any
export function getMockParticipantArgs(
  args?: string | GetMockParticipantArgsOptions,
) {
  const opts = {} as NonNullable<
    ConstructorParameters<typeof MockParticipant>[0]
  >

  if (u.isStr(args)) args = { sid: args }

  if (args) {
    if (args.audioTracks) {
      opts.audioTracks = new Map(u.entries(args.audioTracks))
    }
    if (args.videoTracks) {
      opts.videoTracks = new Map(u.entries(args.videoTracks))
    }
  }

  opts.identity = args?.identity || getRandomKey()
  opts.networkQualityLevel = args?.networkQualityLevel || 5
  opts.networkQualityStats = {}
  if (args?.networkQualityStats) {
    opts.networkQualityStats.level = args.networkQualityStats.level || 5
  }
  opts.networkQualityStats.audio = {} as any
  opts.networkQualityStats.video = {} as any
  opts.sid = args?.sid || getRandomKey()
  opts.state = args?.state || ''
  {
    opts.tracks = new Map()
    if (args?.audioTracks)
      args?.audioTracks.values()?.forEach?.((track) => {
        opts.tracks?.set(track?.trackSid, getTrackOptions('audio', track))
      })
    if (args?.videoTracks)
      args?.videoTracks.values()?.forEach?.((track) => {
        opts.tracks?.set(track?.trackSid, getTrackOptions('video', track))
      })
  }
  return opts
}

export function createMockLocalParticipant(sid: string): MockLocalParticipant
export function createMockLocalParticipant(
  options?: ConstructorParameters<typeof MockLocalParticipant>[0],
): MockLocalParticipant
export function createMockLocalParticipant(
  options?: string | ConstructorParameters<typeof MockLocalParticipant>[0],
) {
  if (u.isStr(options)) options = { sid: options }
  const localParticipant = new MockLocalParticipant(options)
  if (!localParticipant.audioTracks) localParticipant.audioTracks = new Map()
  if (!localParticipant.videoTracks) localParticipant.videoTracks = new Map()
  if (!localParticipant.dataTracks) localParticipant.dataTracks = new Map()
  if (!localParticipant.tracks) localParticipant.tracks = new Map()
  if (!localParticipant.state) localParticipant.state = 'idle'
  if (u.isNil(localParticipant.networkQualityLevel)) {
    localParticipant.networkQualityLevel = 5
  }
  if (!localParticipant.networkQualityStats) {
    localParticipant.networkQualityStats = { audio: {}, video: {} }
  }
  if (!localParticipant.identity) localParticipant.identity = getRandomKey()
  return localParticipant
}

export function createMockRemoteParticipant(
  options?: ConstructorParameters<typeof MockLocalParticipant>[0],
) {
  const remoteParticipant = new MockRemoteParticipant(options)
  return remoteParticipant
}
