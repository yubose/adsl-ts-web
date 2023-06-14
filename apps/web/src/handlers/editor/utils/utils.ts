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

let HTML = `<span data-w-e-type="--type--" data-w-e-is-void --isInline-- data-value="--key--">--key--</span>`
const isInlineList = new Set(["divider", "sharpblock"])

const insertNode = (editor: IDomEditor, type: string, value: string, selection, isChange: boolean = false) => {

    const ischangeNode = (isInline: boolean) => {
        if(!isInline) {
            if(isChange) {
                editor.deleteBackward("block")
                let html = HTML
                    .replace(/--type--/g, type)
                    .replace(/--key--/g, value)
                    .replace(/--isInline-- /g, "")
                editor.dangerouslyInsertHtml(html)
            } else {
                const selectNode = editor.getFragment()
                // @ts-ignore
                if(isInlineList.has(selectNode[0].type)) {
                    insertBreak(editor)
                }
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
            }
            insertBreak(editor)
        } else {
            isChange && editor.deleteBackward("block")
            let html = HTML
                .replace(/--type--/g, type)
                .replace(/--key--/g, value)
                .replace(/--isInline--/g, "data-w-e-is-inline")
            editor.dangerouslyInsertHtml(html)
        }
    }

    if(value !== ''){
        editor.focus()
        editor.select(selection)
        if(type === "sharpblock"){
            ischangeNode(false)
        }
        if(type === "atblock"){
            ischangeNode(true)
        }
    }
}

const insertBreak = (editor: IDomEditor) => {
    const Break = {
        type: "paragraph",
        children: [
            {text: ""}
        ]
    }
    editor.insertNode(Break)
}

export {
    toReg,
    insertText,
    insertNode
}