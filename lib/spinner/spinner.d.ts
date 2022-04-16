/**
 * Progressed from https://spin.js.org/
 */
export declare class Spinner {
    animateId: number | undefined;
    el: HTMLElement | undefined;
    opts: Record<string, any>;
    constructor(opts?: Record<string, any>);
    /**
     * Adds the spinner to the given target element. If this instance is already
     * spinning, it is automatically removed from its previous target by calling
     * stop() internally.
     */
    spin(target?: HTMLElement): this;
    /**
     * Stops and removes the Spinner.
     * Stopped spinners may be reused by calling spin() again.
     */
    stop(): this;
}
