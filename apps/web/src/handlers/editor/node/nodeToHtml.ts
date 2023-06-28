import { SlateElement } from "@wangeditor/editor";

function AtBlockToHtml(elem: SlateElement, childrenHtml: string): string {

    // @ts-ignore
    const { value = "" } = elem

    // 生成 HTML 代码
    const html = `<span data-w-e-type="atblock" data-w-e-is-void data-w-e-is-inline data-value="${value}">${value}</span>`

    return html
}
function SharpBlockToHtml(elem: SlateElement, childrenHtml: string): string {

    // @ts-ignore
    const { value = "", key = "" } = elem

    // 生成 HTML 代码
    const html = `<span data-w-e-type="sharpblock" data-w-e-is-void data-key="${key}" data-value="${value}">${value}</span>`

    return html
}


export { 
    AtBlockToHtml,
    SharpBlockToHtml
}