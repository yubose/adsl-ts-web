import { DomEditor, IDomEditor, SlateElement, SlateTransforms } from "@wangeditor/editor";
import { getUuid } from "../utils/utils";

function withBlock<T extends IDomEditor>(editor: T) {
    const { isInline, isVoid, apply, insertData } = editor
    const newEditor = editor

    newEditor.isInline = elem => {
        const type = DomEditor.getNodeType(elem)
        if(type === "atblock") return true
        if(type === "sharpblock") return false
        if(type === "choiceblock") return false
        // if(type === "infoblock") return true
        return isInline(elem)
    }

    newEditor.isVoid = elem => {
        const type = DomEditor.getNodeType(elem)
        if(type === "atblock") return true
        if(type === "sharpblock") return true
        if(type === "choiceblock") return true
        // if(type === "infoblock") return true
        return isVoid(elem) 
    } 

    newEditor.apply = operation => {
        // @ts-ignore
        if(operation.type === "insert_node" && operation.node && operation.node.type === 'table') {
            // @ts-ignore
            operation.node.width = "100%"
        }
        apply(operation)
    }

    // newEditor.insertData = data => {
    //     console.log(newEditor.operations, data.dropEffect, data.items?.[0].getAsFile())
    //     if(data.items.length > 0) {
    //         // const image = data.items[0].getAsFile() as File
    //         // const reader = new FileReader()
    //         // reader.onload = e => {
    //         //     const node = {
    //         //         type: "image",
    //         //         alt: getUuid(),
    //         //         src: e.target?.result,
    //         //         href: '',
    //         //         children: [
    //         //             {text: ''}
    //         //         ]
    //         //     }
    //         //     newEditor.insertNode(node)
    //         // }
    //         // reader.readAsDataURL(image)
    //     } else {
    //         insertData(data)
    //     }
    // }

    return newEditor
}

export default withBlock