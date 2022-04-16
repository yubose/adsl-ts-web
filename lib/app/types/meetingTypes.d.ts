import { Viewport } from 'noodl-ui';
import { NDOM, NDOMPage } from 'noodl-ui';
import tw from 'twilio-video';
/**
 * Additional static typings (not part of the twilio-video cdn script)
 */
export declare type LocalTrack = tw.LocalTrack;
export declare type LocalParticipant = tw.LocalParticipant;
export declare type LocalAudioTrack = tw.LocalAudioTrack;
export declare type LocalVideoTrack = tw.LocalVideoTrack;
export declare type LocalVideoTrackPublication = tw.LocalVideoTrackPublication;
export declare type LocalAudioTrackPublication = tw.LocalAudioTrackPublication;
export declare type RemoteTrack = tw.RemoteTrack;
export declare type RemoteParticipant = tw.RemoteParticipant;
export declare type RemoteAudioTrackPublication = tw.RemoteAudioTrackPublication;
export declare type RemoteTrackPublication = tw.RemoteTrackPublication;
export declare type RemoteVideoTrackPublication = tw.RemoteVideoTrackPublication;
export declare type RoomParticipant = LocalParticipant | RemoteParticipant;
export declare type RoomParticipantTrackPublication = tw.LocalTrackPublication | tw.RemoteTrackPublication;
export declare type RoomTrack = tw.LocalTrack | tw.RemoteTrack;
export declare type Room = tw.Room;
export interface InitializeMeetingOptions {
    ndom: NDOM;
    page: NDOMPage;
    viewport: Viewport;
}
export declare type StreamType = 'mainStream' | 'selfStream' | 'subStream';
