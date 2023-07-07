import { IDomEditor, SlateElement, SlateLocation, SlatePoint, SlateRange } from "@wangeditor/editor"
import { DATA } from "./editorChoiceMap"
import formatKey from "./format"
import { textSharpSplitChar, textSharpSplitReg } from "./textSharp"

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
const inlineBlock = new Set(["atblock"])

const insertNode = ({
    editor,
    type,
    value,
    selection,
    isChange = false,
    choiceArray
}: {
    editor: IDomEditor, 
    type: string, 
    value: string, 
    selection, 
    isChange?: boolean,
    choiceArray?: Array<DATA>
}) => {

    const ischangeNode = (isInline: boolean) => {
        let isInsertBreak = true
        let choiceStr = ""
        let dataArrayStr = ` data-array="--REPLACE--"`
        if(!isInline) {
            const ID = getUuid()
            if(choiceArray) {
                choiceStr += textSharpSplitChar
                choiceArray.forEach(item => {
                    choiceStr += `${item.title.replace(/[<>"]/g, function(c){return Escape.get(c) as string})}${textSharpSplitChar}${item.check}${textSharpSplitChar}`
                })
            }
            dataArrayStr = dataArrayStr.replace(/--REPLACE--/, choiceStr)
            // if(type !== "choiceblock") dataArrayStr = ''
            if(isChange) {
                editor.deleteBackward("word")
                let html = HTML
                    .replace(/--type--/g, type)
                    .replace(/--key--/g, value)
                    .replace(/--isInline--/g, `data-key="${ID}"${dataArrayStr}`)
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
                    key: ID,
                    choiceStr,
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
        ischangeNode(inlineBlock.has(type))
        // if(type === "sharpblock" || type === "choiceblock"){
        //     ischangeNode(false)
        // }
        // if(type === "atblock"){
        //     ischangeNode(true)
        // }
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
    let index = 0
    let hash = ``
    const setUuid = () => {
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
        const newHash = prefixChar + dateChar
        if(newHash === hash) {
            index++
        } else {
            index = 0
            hash = newHash
        }
        return newHash + `${index}`
    }
    return setUuid()
}

const getHTMLDataArray = (str: string) => {
    let dom = document.createElement("div")
    dom.innerHTML = str
    const target = dom.childNodes[0] as HTMLElement
    const dataArray = target.getAttribute("data-array")
    return dataArray ? dataArray : ""
}

const Escape = new Map([
    ['<', '&lt;'],
    ['>', '&gt;'],
    ['&', '&amp;'],
    ['"', '&quot;']
])

const reverseEscape = new Map([
    ['&lt;', '<'],
    ['&gt;', '>'],
    ['&amp;', '&'],
    ['&quot;', '"']
])

export {
    toReg,
    insertText,
    insertNode,
    getUuid,
    getHTMLDataArray,
    reverseEscape
}