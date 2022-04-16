import { ComponentObject } from 'noodl-types';
import { NUI, NDOMElement } from 'noodl-ui';
import Stream from './Stream';
import * as t from '../app/types';
/** The container for subStreams */
declare class MeetingSubstreams {
    #private;
    blueprint: ComponentObject;
    container: NDOMElement | null;
    resolver: typeof NUI.resolveComponents;
    constructor(container: NDOMElement, opts?: {
        blueprint?: ComponentObject;
        resolver?: typeof NUI.resolveComponents;
    });
    get length(): number;
    /**
     * Adds a new stream instance to the subStreams collection. If a node was passed in
     * it will be inserted into the DOM. If a participant was passed in their media tracks will attempt to start automatically
     * @param { HTMLElement | undefined } node
     * @param { RemoteParticipant | undefined } participant
     */
    create({ node, participant, }?: {
        node?: HTMLElement;
        participant?: t.RemoteParticipant;
    }): this;
    /**
     * Inserts/pushes a stream into the subStreams collection
     * If an index is passed in, it will insert the stream at the index position
     * @param { Stream } stream
     * @param { number | undefined } index
     */
    addToCollection(stream: Stream, index?: number): this;
    getSubstreamsCollection(): Stream[];
    /**
     * Returns true if the element is already bound to a subStream in the
     * collection
     * @param { NDOMElement } node
     */
    elementExists(node: NDOMElement): boolean;
    /**
     * Returns true if the participant is already bound to a subStream in
     * the collection
     * @param { RoomParticipant } participant
     */
    participantExists(participant: t.RoomParticipant): boolean;
    /**
     * Returns the stream from the subStreams collection, null otherwise
     * @param { RoomParticipant } participant
     */
    getSubStream(participant: t.RoomParticipant): Stream;
    /**
     * Loops over the subStreams collection and returns the first stream where
     * the predicate function returns truthy
     * @param { Stream } stream
     */
    findBy(cb: (stream: Stream) => boolean): Stream;
    findByParticipant(participant: t.RoomParticipant): Stream;
    /**
     * Removes the given stream from the subStreams collection
     * If stream was passed as an index then it is used as the index to remove
     * the stream that is found at that position in the collection
     * @param { Stream | number } stream - Stream or index to remove
     */
    removeSubStream(stream: Stream): this;
    removeSubStream(index: number): this;
    /** Returns the first subStream in the collection */
    first(): Stream;
    /** Returns the last subStream in the collection */
    last(): Stream;
    reset(): this;
    snapshot(): {
        children: any[];
        container: HTMLElement;
        hasBlueprint: boolean;
        hasResolver: boolean;
        length: number;
        type: string;
    };
}
export default MeetingSubstreams;
