/// <reference types="node" />
export interface TimerObject {
    dataKey: string;
    page: string;
    ref: NodeJS.Timeout | null;
    value: any;
}
declare class Timer implements TimerObject {
    #private;
    dataKey: string;
    page: string;
    value: any;
    ref: NodeJS.Timeout | null;
    onStart: ((inst: Timer) => void) | undefined;
    onStop: ((inst: Timer) => void) | undefined;
    onClear: ((inst: Timer) => void) | undefined;
    constructor({ dataKey, value, page, increment, onStart, onStop, onClear, }: Pick<Partial<TimerObject>, 'dataKey' | 'value'> & Pick<Partial<Timer>, 'onStart' | 'onStop' | 'onClear'> & {
        increment?(inst: Timer): void;
        page: TimerObject['page'];
    });
    start(): void;
    stop(): void;
    increment(): void;
    clear(): void;
}
export default Timer;
