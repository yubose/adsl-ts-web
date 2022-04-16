import type { Options as Html2CanvasOptions } from 'html2canvas';
import type jsPDF from 'jspdf';
import type { FlatObject, Orientation } from './exportPdfTypes';
import type { flatten } from './flatten';
export interface GeneratePagesOptions {
    pdf: jsPDF;
    el: HTMLElement;
    flattener: ReturnType<typeof flatten>;
    orientation?: Orientation;
    pageWidth: number;
    pageHeight: number;
    generateCanvasOptions?: Partial<Omit<Html2CanvasOptions, 'onclone'>> & {
        /**
         * Callback called with the cloned element.
         * Optionally mutate this cloned element to modify the output if needed.
         * The first (immediate) child of the container argument is the cloned "el" argument passed below
         */
        onclone?: (args: {
            htmlDocument: Document;
            el: HTMLElement;
            elements: HTMLElement[];
        }) => HTMLElement | undefined | null;
    };
    use?: {
        addImage?: (args: {
            width: number;
            height: number;
        } & {
            ratio: number;
            pageWidth: number;
            pageHeight: number;
            currFlat?: FlatObject;
        }) => {
            width: number;
            height: number;
        };
        clonedContainer?: (args: {
            htmlDocument: Document;
            el: Element | HTMLElement;
            elements: HTMLElement[];
        }) => HTMLElement;
    };
}
declare function generatePages({ pdf, el, flattener, generateCanvasOptions, orientation, pageWidth, pageHeight, use, }: GeneratePagesOptions): Promise<jsPDF>;
export default generatePages;
