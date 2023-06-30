import { IDomEditor, SlateElement } from "@wangeditor/editor";
import { h, VNode } from "snabbdom";
import choice from "../utils/choice";
import { SharpType } from "../utils/config";
import { inputPopUp } from "../utils/popUp";
import searchPopUp from "../utils/search";
import { choiceSharpReg, textSharpReg, textSharpSplitReg } from "../utils/textSharp";

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
    const { value = "" } = elem

    const attachVnode = h(
        "span",
        {   
            attrs: {
                class: "w-e-button w-e-sharpblock"
            },
            on: {
                "click": (event) => {
                    const selection = editor.selection
                    if(textSharpReg.test((event.target as HTMLElement).innerText)) {
                        // console.log((event.target as HTMLElement).innerText.split(textSharpSplitReg))
                        const text = (event.target as HTMLElement).innerText.split(textSharpSplitReg)[0].replace(/[#*]/g, '')
                        // console.log(text)
                        inputPopUp(editor, text as SharpType, selection, event.target as HTMLElement)
                    }
                }
            }
        },
        // @ts-ignore
        [value]
    )

    return attachVnode
}

function renderChoiceBlock(elem: SlateElement, children: VNode[] | null, editor: IDomEditor): VNode {

    // @ts-ignore
    const { value = "", choiceStr } = elem

    const attachVnode = h(
        "span",
        {   
            attrs: {
                class: "w-e-button w-e-sharpblock",
                "data-array": choiceStr
            },
            on: {
                "click": (event) => {
                    const selection = editor.selection
                    if(choiceSharpReg.test((event.target as HTMLElement).innerText)) {
                        choice({
                            editor,
                            selection,
                            target: event.target as HTMLElement
                        })
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
   renderSharpBlock,
   renderChoiceBlock
} 