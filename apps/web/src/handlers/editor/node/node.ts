import { IDomEditor, SlateElement } from "@wangeditor/editor";
import { h, VNode } from "snabbdom";
import choice from "../utils/choice";
import { SharpType } from "../utils/config";
import dateAndTime from "../utils/dateAndtime";
import { inputPopUp } from "../utils/popUp";
import searchPopUp from "../utils/search";
import { choiceSharpReg, textSharpReg, textSharpSplitReg } from "../utils/textSharp";
import { editorBlockCss, editorBlockSet } from "../utils/utils";

function renderAtBlock(elem: SlateElement, children: VNode[] | null, editor: IDomEditor): VNode {

    // @ts-ignore
    const { value = "" } = elem

    const attachVnode = h(
        "span",
        {   
            attrs: {
                class: "w-e-button w-e-atblock"
            },
            on: {
                "click": (event) => {
                    const selection = editor.selection
                    searchPopUp({
                        editor, 
                        selection, 
                        isChange:true
                    })
                }
            }
        },
        // @ts-ignore
        [value]
    )

    return attachVnode
}



function renderSharpBlock(elem: SlateElement, children: VNode[] | null, editor: IDomEditor): VNode {

    // @ts-ignore
    const { value = "", choiceStr = "" } = elem

    const tips = document.createElement("div")
    tips.style.cssText = `
        width: 100%;
        min-height: ${editorBlockCss.height};
        white-space: pre-wrap;
        word-break: break-word;
        border-radius: 4px;
        border: 1px solid #cccccc;
        position: absolute;
        left: 0px;
        margin-top: 5px;
        background: #ffffff;
        z-index: 10;
    `
    tips.innerText = value

    const attachVnode = h(
        "span",
        {   
            attrs: {
                class: "w-e-button w-e-sharpblock",
                "data-array": choiceStr
            },
            on: {
                "click": (event) => {
                    const selection = editor.selection;
                    (event.target as HTMLElement).innerText = value
                    if(textSharpReg.test((event.target as HTMLElement).innerText)) {
                        // console.log((event.target as HTMLElement).innerText.split(textSharpSplitReg))
                        const text = (event.target as HTMLElement).innerText.split(textSharpSplitReg)[0].replace(/[#*]/g, '')
                        // console.log(text)
                        inputPopUp(editor, text as SharpType, selection, event.target as HTMLElement)
                    } else if(choiceSharpReg.test((event.target as HTMLElement).innerText)) {
                        const type = (event.target as HTMLElement).innerText.split(textSharpSplitReg)[0].replace(/[#*$]/g, '')
                        if(editorBlockSet.choiceSet.has(type))
                            choice({
                                editor,
                                selection,
                                target: event.target as HTMLElement
                            })
                        else if(editorBlockSet.dateTimeSet.has(type))
                            dateAndTime({
                                editor,
                                selection,
                                target: event.target as HTMLElement
                            })
                    }
                },
                "mouseenter": (event) => {
                    const target = event.target as HTMLSpanElement
                    const clientWidth = target.clientWidth;
                    const scrollWidth = target.scrollWidth;
                    if(clientWidth < scrollWidth)
                        target.appendChild(tips)
                },
                "mouseout": (event) => {
                    const target =event.target as HTMLSpanElement
                    try {
                        target.removeChild(tips)
                    } catch (error) {
                        
                    }
                }
            }
        },
        // @ts-ignore
        [value]
    )

    return attachVnode
}

export {
   renderAtBlock,
   renderSharpBlock
} 