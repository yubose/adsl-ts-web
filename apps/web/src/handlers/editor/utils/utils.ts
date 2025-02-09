import { IDomEditor, SlateElement, SlateLocation, SlatePoint, SlateRange } from "@wangeditor/editor"
import { DATA } from "./editorChoiceMap"
import formatKey from "./format"
import { choiceArrayStrReg, textSharpSplitChar, textSharpSplitReg } from "./textSharp"

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
                    choiceStr += `${item.title}${textSharpSplitChar}${item.check}${textSharpSplitChar}`
                })
            }
            dataArrayStr = dataArrayStr.replace(/--REPLACE--/, choiceStr)
            // if(type !== "choiceblock") dataArrayStr = ''
            if(isChange) {
                editor.deleteBackward("word")
                let html = HTML
                    .replace(/--type--/g, type)
                    // .replace(/--key--/g, value)
                    .replace(/--isInline--/g, `data-key="${ID}"${dataArrayStr}`)
                let div = document.createElement('div')
                div.innerHTML = html
                const span = div.childNodes[0] as HTMLSpanElement
                span.innerText = value
                span.setAttribute('data-value', value)
                editor.dangerouslyInsertHtml(div.innerHTML)
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

let index = 0
// let hash = ``
const getUuid = () => {
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
        index++
        return newHash + `${index}`
    }
    return setUuid()
}

const getHTMLDataArray = (str: string) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(str, 'text/html')
    const target = doc.querySelector('span') 
    const dataArray = target?.getAttribute("data-array")
    return dataArray ? decode(dataArray) : ""
}

const encode = (str: string) => {
    return str.replace(/[&<>"']/g, (match: string) => {
        if(Escape.has(match)) {
            return Escape.get(match) as string
        } else {
            return ""
        }
    })
}

const decode = (str: string) => {
    return str.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, (match: string) => {
        if(reverseEscape.has(match)) {
            return reverseEscape.get(match) as string
        } else {
            return ""
        }
    })
}

const Escape = new Map([
    ['<', '&lt;'],
    ['>', '&gt;'],
    ['&', '&amp;'],
    ['"', '&quot;'],
    ["'", '&#39;']
])

const reverseEscape = new Map([
    ['&lt;', '<'],
    ['&gt;', '>'],
    ['&amp;', '&'],
    ['&quot;', '"'],
    ["&#39;", "'"]
])

const editorBlockCss = {
    height: "24px"
}

const editorBlockSet = {
    choiceSet: new Set(["Radio", "Checkbox", "Drop Down Box"]),
    dateTimeSet: new Set(["Date", "Time", "Date&Time"])
}

const replaceDoubleQuotes = (str: string) => {
    return str.replace(/"/g, '\"')
}

export {
    toReg,
    insertText,
    insertBreak,
    insertNode,
    getUuid,
    getHTMLDataArray,
    Escape,
    reverseEscape,
    editorBlockCss,
    editorBlockSet,
    replaceDoubleQuotes,
    encode,
    decode
}