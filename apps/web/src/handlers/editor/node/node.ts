import { IDomEditor, SlateElement } from "@wangeditor/editor";
import { h, VNode } from "snabbdom";
import { SharpType } from "../utils/config";
import { inputPopUp } from "../utils/popUp";
import searchPopUp from "../utils/search";

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
    const { value = "", id = "" } = elem

    const attachVnode = h(
        "span",
        {   
            attrs: {
                class: "w-e-button w-e-sharpblock",
                dataId: id
            },
            on: {
                "click": (event) => {
                    const selection = editor.selection
                    if(/#[\w*]+\|-\|[\s\S]+\|-\|[\s\S]+/.test((event.target as HTMLButtonElement).innerText)) {
                        const text = (event.target as HTMLButtonElement).innerText.split(/\|-\|/)[0].replace(/[#*]/g, '')
                        // console.log(text)
                        inputPopUp(editor, text as SharpType, selection, event.target as HTMLButtonElement)
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