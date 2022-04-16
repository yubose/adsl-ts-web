import type { Options as Html2CanvasOptions } from 'html2canvas';
declare function generateCanvas(el: HTMLElement, options?: Partial<Html2CanvasOptions>): Promise<HTMLCanvasElement>;
export default generateCanvas;
