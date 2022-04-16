import { Viewport as VP } from 'noodl-ui';
export interface GetViewportSizeWithMinMaxArgs {
    width: number;
    height: number;
    min: string | number;
    max: string | number;
    aspectRatio: number;
}
export declare function getViewportSizeWithMinMax({ width, height, min, max, aspectRatio, }: GetViewportSizeWithMinMaxArgs): {
    width: number;
    height: number;
};
declare const createViewportHandler: (viewport: VP) => {
    computeViewportSize({ width, height, previousWidth, previousHeight, }: {
        width: number;
        height: number;
    } & {
        previousWidth: number | undefined;
        previousHeight: number | undefined;
    }): {
        width: number;
        height: number;
        previousWidth: number;
        previousHeight: number;
        aspectRatio: number;
        min: number;
        max: number;
    };
    getCurrentAspectRatio(): number;
    getMinMaxRatio(): {
        min: number;
        max: number;
    };
    isConstrained(): boolean;
    on(ev: string, fn: Function): {
        computeViewportSize({ width, height, previousWidth, previousHeight, }: {
            width: number;
            height: number;
        } & {
            previousWidth: number | undefined;
            previousHeight: number | undefined;
        }): {
            width: number;
            height: number;
            previousWidth: number;
            previousHeight: number;
            aspectRatio: number;
            min: number;
            max: number;
        };
        getCurrentAspectRatio(): number;
        getMinMaxRatio(): {
            min: number;
            max: number;
        };
        isConstrained(): boolean;
        on(ev: string, fn: Function): any;
        setMinAspectRatio(value: number): any;
        setMaxAspectRatio(value: number): any;
        setViewportSize({ width, height }: {
            width: number;
            height: number;
        }): any;
    };
    setMinAspectRatio(value: number): any;
    setMaxAspectRatio(value: number): any;
    setViewportSize({ width, height }: {
        width: number;
        height: number;
    }): {
        computeViewportSize({ width, height, previousWidth, previousHeight, }: {
            width: number;
            height: number;
        } & {
            previousWidth: number | undefined;
            previousHeight: number | undefined;
        }): {
            width: number;
            height: number;
            previousWidth: number;
            previousHeight: number;
            aspectRatio: number;
            min: number;
            max: number;
        };
        getCurrentAspectRatio(): number;
        getMinMaxRatio(): {
            min: number;
            max: number;
        };
        isConstrained(): boolean;
        on(ev: string, fn: Function): any;
        setMinAspectRatio(value: number): any;
        setMaxAspectRatio(value: number): any;
        setViewportSize({ width, height }: {
            width: number;
            height: number;
        }): any;
    };
    viewport: VP;
};
export default createViewportHandler;
