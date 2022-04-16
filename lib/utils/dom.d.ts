import { Toast } from 'vercel-toast';
import { FileSelectorResult } from '../app/types';
import type { Format as PdfPageFormat } from '../modules/ExportPdf';
export declare function copyToClipboard(value: string): any;
export declare function fromClipboard(): Promise<string>;
export declare function isHtmlElement(node: Node): node is HTMLElement;
export declare function download(url: string | Blob, filename?: string): void;
export declare function exportToPDF({ data, download: shouldDownload, labels, format: formatProp, open, filename, }?: {
    data: string | {
        title?: string;
        content?: string;
        data?: string;
    } | HTMLElement;
    download?: boolean;
    format?: PdfPageFormat;
    labels?: boolean;
    open?: boolean;
    filename?: string;
}): Promise<Blob>;
export declare function getDataUrl(elem: HTMLImageElement): string;
export declare function getDocumentScrollTop(doc?: Document | null): number;
export declare function getVcodeElem(dataKey?: string): HTMLInputElement;
export declare const hide: (nodes: import("noodl-ui").DOMNodeInput, cb?: (node: HTMLElement) => void) => number | false;
export declare const show: (nodes: import("noodl-ui").DOMNodeInput, cb?: (node: HTMLElement) => void) => number | false;
/**
 * Returns true if the value can be displayed in the UI as normal.
 * A displayable value is any value that is a string or number
 * @param { any } value
 */
export declare function isDisplayable(value: unknown): value is string | number;
export declare function isVisible(node: HTMLElement | null): boolean;
/**
 * Opens the file select window. The promise resolves when a file was
 * selected, which becomes the resolved value.
 * @param { HTMLInputElement? } inputNode - Optional existing input node to use
 */
export declare function openFileSelector(inputNode?: HTMLInputElement): Promise<FileSelectorResult>;
declare type DocumentScrollTopOptions = {
    top?: number;
    left?: number;
    smooth?: boolean;
    win?: Window;
};
/**
 * Set the current vertical position of the scroll bar for document
 * Note: do not support fixed position of body
 * @param { number } value
 */
export declare function setDocumentScrollTop(opts: DocumentScrollTopOptions): void;
export declare function setDocumentScrollTop(top?: number, win?: Window | null): void;
export declare function setDocumentScrollTop(str: 'bottom'): void;
export declare function setDocumentScrollTop(str: 'center'): void;
/**
 * Scroll to location with animation
 * @param  {Number} to       to assign the scrollTop value
 * @param  {Number} duration assign the animate duration
 * @return {Null}            return null
 */
export declare function scrollTo(to: number, duration: number, { doc, win }: {
    doc?: Document | null;
    win?: Window | null;
}): void;
export declare function scrollToElem(node: any, { win, doc, duration, }?: {
    win?: Window | null;
    doc?: Document | null;
    duration?: number;
}): void;
export declare function toast(message: string | number, options?: Toast['options']): Toast;
export declare function getBlobFromCanvas(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob | null>;
export declare function parseCssText(cssText: string): CSSStyleDeclaration;
/**
 * Deeply traverse a DOM element's children (Depth first)
 */
export declare function traverseDFS<R = any>(cb: (childNode: Element | HTMLElement, index: number, parent: Element | HTMLElement | null) => R, el: Element | HTMLElement | null | undefined): R[];
export {};
