import { RoomParticipant, RoomParticipantTrackPublication, StreamType } from '../app/types';
declare class MeetingStream {
    #private;
    previous: {
        sid?: string;
        identity?: string;
    };
    type: StreamType | null;
    events: Map<string, ((...args: any[]) => any)[]>;
    constructor(type: StreamType, { node }?: {
        node?: HTMLElement;
    });
    get tracks(): RoomParticipantTrackPublication[];
    get audioTrackPublication(): import("twilio-video").LocalAudioTrackPublication | import("twilio-video").RemoteAudioTrackPublication;
    get videoTrackPublication(): import("twilio-video").LocalVideoTrackPublication | import("twilio-video").RemoteVideoTrackPublication;
    get audioTrack(): import("twilio-video").LocalAudioTrack | import("twilio-video").RemoteAudioTrack;
    get videoTrack(): import("twilio-video").LocalVideoTrack | import("twilio-video").RemoteVideoTrack;
    getElement(): HTMLElement;
    hasElement(): boolean;
    setElement(node: HTMLElement | null): void;
    /**
     * Removes the main node of this stream (container)
     */
    removeElement(): void;
    /**
     * Returns true if the node is already set on this instance
     * @param { HTMLElement } node
     */
    isSameElement(node: HTMLElement): boolean;
    getAudioElement(): HTMLAudioElement;
    hasAudioElement(): boolean;
    removeAudioElement(): void;
    getVideoElement(): HTMLVideoElement;
    hasVideoElement(): boolean;
    removeVideoElement(): void;
    getParticipant(): RoomParticipant;
    hasParticipant(): boolean;
    /**
     * Returns true if the node is already set on this instance
     * @param { RoomParticipant } participant
     */
    isParticipant(participant: RoomParticipant): boolean;
    /**
     * Sets the participant's sid to do the data-sid attribute if the node is
     * available as well as bind the participant to this stream and attempts
     * to reload their tracks onto the DOM
     * @param { RoomParticipant } participant
     */
    setParticipant(participant: RoomParticipant): this;
    /**
     * Removes the participant's video/audio track as well as their video/audio element they were bound to
     */
    unpublish(): this;
    /**
     * Re-queries for the currrent participant's tracks and assigns them to the
     * currently set node if they aren't set
     */
    reloadTracks(only?: 'audio' | 'video'): void;
    /** Returns a JS representation of the current state of this stream */
    snapshot(otherArgs?: any): any;
    /**
     * Wipes out the state entirely.
     * Useful for cleanup operations and avoids memory leaks
     */
    reset({ keepStreamType }?: {
        keepStreamType?: boolean;
    }): this;
    toggleBackdrop(type: 'open' | 'close'): void;
}
export default MeetingStream;
