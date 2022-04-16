import App from '../App';
import Stream from '../meeting/Stream';
import Streams from '../meeting/Streams';
import * as t from '../app/types';
declare const createMeetingFns: (app: App) => {
    calledOnConnected: boolean;
    readonly isConnected: boolean;
    readonly localParticipant: import("twilio-video").LocalParticipant;
    room: import("twilio-video").Room & {
        _isMock?: boolean;
    };
    readonly mainStream: Stream;
    readonly selfStream: Stream;
    readonly subStreams: import("./Substreams").default;
    readonly streams: Streams;
    /**
     * Joins and returns the room using the token
     * @param { string } token - Room token
     */
    join(token: string): Promise<import("twilio-video").Room & {
        _isMock?: boolean;
    }>;
    rejoin(): Promise<import("twilio-video").Room & {
        _isMock?: boolean;
    }>;
    hideWaitingOthersMessage(): void;
    showWaitingOthersMessage(): void;
    /** Disconnects from the room */
    leave(): any;
    /**
     * Adds a remote participant to the sdk and the internal state
     * @param { RemoteParticipant } participant
     * @param { object } options - This is temporarily used for debugging
     */
    addRemoteParticipant(participant: t.RoomParticipant, { force, }?: {
        force?: boolean;
    }): Promise<any>;
    removeRemoteParticipant(participant: t.RoomParticipant, { force }?: {
        force?: boolean;
    }): any;
    /**
     * Returns true if the participant is the LocalParticipant
     * @param { RoomParticipant } participant
     */
    isLocalParticipant(participant: t.RoomParticipant): participant is import("twilio-video").LocalParticipant;
    /** Element used for the dominant/main speaker */
    getMainStreamElement(): HTMLDivElement | null;
    /** Element that the local participant uses (self mirror) */
    getSelfStreamElement(): HTMLDivElement | null;
    /** Element that renders a remote participant into the participants list */
    getSubStreamElement(): HTMLDivElement | HTMLDivElement[] | null;
    /** Element that toggles the camera on/off */
    getCameraElement(): HTMLImageElement | null;
    /** Element that toggles the microphone on/off */
    getMicrophoneElement(): HTMLImageElement | null;
    /** Element that completes the meeting when clicked */
    getHangUpElement(): HTMLImageElement | null;
    /** Element to invite other participants into the meeting */
    getInviteOthersElement(): HTMLImageElement | null;
    /** Element that renders a list of remote participants on the bottom */
    getParticipantsListElement(): HTMLUListElement | null;
    getVideoChatElements(): {
        mainStream: HTMLDivElement;
        selfStream: HTMLDivElement;
        subStream: HTMLDivElement | HTMLDivElement[];
        camera: HTMLImageElement;
        microphone: HTMLImageElement;
        hangUp: HTMLImageElement;
        inviteOthers: HTMLImageElement;
        videoSubStream: HTMLUListElement;
    };
    getWaitingMessageElements(): HTMLElement[];
    /**
     * Wipes the entire internal state. This is mainly just used for testing
     */
    reset(key?: 'room' | 'streams'): any;
    removeFalseParticipants(participants: any[]): any[];
    /**
     * Switches a participant's stream to another participant's stream
     * @param { Stream } stream1
     * @param { Stream } stream2
     * @param { t.RoomParticipant } participant1
     * @param { t.RoomParticipant } participant2
     */
    swapParticipantStream(stream1: Stream, stream2: Stream, participant1: t.RoomParticipant, participant2: t.RoomParticipant): void;
} & {
    onConnected(room: t.Room): any;
    onAddRemoteParticipant(participant: t.RemoteParticipant, stream: Stream): any;
    onRemoveRemoteParticipant(participant: t.RemoteParticipant, stream: Stream): any;
};
export default createMeetingFns;
