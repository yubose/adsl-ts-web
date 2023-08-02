import { DomEditor, IDomEditor, SlateElement, SlateTransforms } from "@wangeditor/editor";
import { insertImage } from "../utils/selectFile";

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

    newEditor.insertData = data => {
        if(data.types[0] === "Files") {
            for(let i = 0; i < data.items.length; i++) {
                if(/image\/.*/.test(data.items[i].type)) {
                    const file = data.items[i].getAsFile()
                    file && insertImage(newEditor, file)
                } else {
                    insertData(data)
                }
            }
        } else {
            insertData(data)
        }
    }

    return newEditor
}

export default withBlock