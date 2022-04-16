import type { FlatObject, FlattenOptions } from './exportPdfTypes';
export declare const createFlattener: (baseEl: Element | HTMLElement) => {
    clear(): void;
    exists: (el: HTMLElement | Element | string | undefined | null) => boolean;
    add: (obj: FlatObject) => void;
    get: () => FlatObject[];
    has: (idOrEl: string | Element | HTMLElement) => boolean;
    toFlat(el: Element | HTMLElement, parent?: Element | HTMLElement): FlatObject;
};
export declare function flatten({ baseEl, el, flattener, currPageHeight, pageHeight, offsetStart, offsetEnd, }: FlattenOptions): {
    clear(): void;
    exists: (el: string | Element | HTMLElement) => boolean;
    add: (obj: FlatObject) => void;
    get: () => FlatObject[];
    has: (idOrEl: string | Element | HTMLElement) => boolean;
    toFlat(el: Element | HTMLElement, parent?: Element | HTMLElement): FlatObject;
};
export default flatten;
