import { IDomEditor, SlateDescendant, SlateElement } from "@wangeditor/editor";

function parseAtBlockHtml(domElement: Element, children: SlateDescendant[], editor: IDomEditor): SlateElement {

    const value = domElement.getAttribute('data-value') || ''

    const AtBlock = {
        type: "atblock",
        value,
        children: [{text: ""}]
    }

    return AtBlock
}
function parseSharpBlockHtml(domElement: Element, children: SlateDescendant[], editor: IDomEditor): SlateElement {

    const value = domElement.getAttribute('data-value') || ''
    const key = domElement.getAttribute('data-key') || ''

    const SharpBlock = {
        type: "sharpblock",
        value,
        key,
        children: [{text: ""}]
    }

    return SharpBlock
}

export { 
    parseAtBlockHtml,
    parseSharpBlockHtml
}