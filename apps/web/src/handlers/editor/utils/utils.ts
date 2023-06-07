import { IDomEditor } from "@wangeditor/editor"

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

export {
    toReg,
    insertText
}