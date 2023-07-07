import { IDomEditor, SlateElement, SlateLocation, SlatePoint, SlateRange } from "@wangeditor/editor"
import formatKey from "./format"

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
        let isInsertBreak = true
        if(!isInline) {
            if(isChange) {
                editor.deleteBackward("word")
                let html = HTML
                    .replace(/--type--/g, type)
                    .replace(/--key--/g, value)
                    .replace(/--isInline--/g, `data-key="${getUuid()}"`)
                editor.dangerouslyInsertHtml(html)
                editor.select(selection)
            } else {
                const selectNode = editor.getFragment()
                // @ts-ignore
                if(isInlineList.has(selectNode[0].type)) {
                    isInsertBreak = false
                    insertBreak(editor)
                }
                const node = {
                    type: type,
                    value: value,
                    key: getUuid(),
                    children: [
                        {
                            text: ""
                        }
                    ]
                }
                editor.insertNode(node)
                // insertBreak(editor)
            }
            isInsertBreak && insertBreak(editor)
        } else {
            isChange && editor.deleteBackward("block")
            let html = HTML
                .replace(/--type--/g, type)
                .replace(/--key--/g, value)
                .replace(/--isInline--/g, "data-w-e-is-inline")
            editor.dangerouslyInsertHtml(html)
        }
    }
    editor.focus()
    editor.select(selection)
    if(value !== ''){
        
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

const getUuid = () => {
    const basePrefixC = 65
    const basePrefix = 97
    const isCap = Math.floor(Math.random()*2)
    const prefix = 
        isCap === 1 ? 
        basePrefixC + Math.floor(Math.random()*26) :
        basePrefix + Math.floor(Math.random()*26)
    const prefixChar = String.fromCharCode(prefix)
    const date = Math.floor(Date.now()/1000)
    const dateChar = date.toString(32)
    return prefixChar + dateChar
}

export {
    toReg,
    insertText,
    insertNode,
    getUuid
}