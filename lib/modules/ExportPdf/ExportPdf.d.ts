import jsPDF from 'jspdf';
import flatten from './flatten';
import generateCanvas from './generateCanvas';
import generatePages from './generatePages';
import * as t from './exportPdfTypes';
export declare const ExportPdf: {
    create: (el: HTMLElement | null | undefined, format?: t.Format) => Promise<jsPDF>;
    flatten: typeof flatten;
    generatePages: typeof generatePages;
    generateCanvas: typeof generateCanvas;
    sizes: {
        A1: {
            width: number;
            height: number;
        };
        A2: {
            width: number;
            height: number;
        };
        A3: {
            width: number;
            height: number;
        };
        A4: {
            width: number;
            height: number;
        };
        A5: {
            width: number;
            height: number;
        };
        A6: {
            width: number;
            height: number;
        };
        A7: {
            width: number;
            height: number;
        };
        A8: {
            width: number;
            height: number;
        };
    };
};
export default ExportPdf;
