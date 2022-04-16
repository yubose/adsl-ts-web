import { ComponentObject } from 'noodl-types';
import { NUI, NDOMElement } from 'noodl-ui';
import { RoomParticipant } from '../app/types';
import Stream from '../meeting/Stream';
import Substreams from '../meeting/Substreams';
declare class MeetingStreams {
    #private;
    constructor();
    toString(): string;
    get mainStream(): Stream;
    get selfStream(): Stream;
    get subStreams(): Substreams;
    createSubStreamsContainer(container: NDOMElement, opts?: {
        blueprint?: ComponentObject;
        resolver?: typeof NUI.resolveComponents;
    }): Substreams;
    isSubStreaming(participant: RoomParticipant): boolean;
    reset(): void;
    snapshot(): {
        mainStream: any;
        selfStream: any;
        subStreams: any[];
    };
}
export default MeetingStreams;
