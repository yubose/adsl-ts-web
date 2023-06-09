import { IDomEditor, SlateLocation, SlatePoint, SlateRange } from "@wangeditor/editor"

const toReg = (str: string): string => {
    return str.replace(/[.\\[\]{}()|^$?*+]/g, "\\$&")
}

const insertText = (editor: IDomEditor, value: string, selection) => {
    editor.select(selection)
    editor.insertText(value)
    editor.focus(true)
    editor.select(selection)
    editor.move(value.length)
}

const insertNode = (editor: IDomEditor, type: string, value: string, selection, isChange: boolean = false) => {
    if(value !== ''){
        editor.focus()
        editor.select(selection)
        isChange && editor.deleteBackward("block")
        const node = {
            type: type,
            value: value,
            children: [
                {
                    text: ""
                }
            ]
        }
        editor.insertNode(node)
        // editor.focus(true)
        // console.log(selection)
        // editor.select(selection)
        // editor.move(2)
    }
}

export {
    toReg,
    insertText,
    insertNode
}