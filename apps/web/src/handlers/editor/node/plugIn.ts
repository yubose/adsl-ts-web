import { DomEditor, IDomEditor, SlateElement } from "@wangeditor/editor";

function withBlock<T extends IDomEditor>(editor: T) {
    const { isInline, isVoid, insertNode } = editor
    const newEditor = editor

    newEditor.isInline = elem => {
        const type = DomEditor.getNodeType(elem)
        if(type === "atblock") return true
        if(type === "sharpblock") return false
        // if(type === "infoblock") return true
        return isInline(elem)
    }

    newEditor.isVoid = elem => {
        const type = DomEditor.getNodeType(elem)
        if(type === "atblock") return true
        if(type === "sharpblock") return true
        // if(type === "infoblock") return true
        return isVoid(elem) 
    }

    // newEditor.insertNode = elem => {
    //     const type = DomEditor.getNodeType(elem)
    //     if(type === "sharpblock") {
    //         console.log(DomEditor.setNewKey(elem))
    //     }
    //     return insertNode(elem)
    // }

    return newEditor
}

export default withBlock