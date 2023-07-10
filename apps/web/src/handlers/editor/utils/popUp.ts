import { IDomEditor } from "@wangeditor/editor"
import Swal from "sweetalert2"
import { Calculate, getCalc } from "./calculate"
import { SharpType } from "./config"
import { textSharpSplitChar, textSharpSplitReg } from "./textSharp"
import { insertNode } from "./utils"

const inputPopUp = (editor: IDomEditor, type: SharpType, selection, target: HTMLElement|undefined = undefined) => {

    const TITLE = type === "TextField" ? `Single line input box` : `Multiline input box`

    const calc = getCalc() as Calculate

    const isChange = target instanceof HTMLElement
    let title = ''
    let placeholder = 'Enter here'
    let isRequired = ''
    if(isChange) {
        title = target.innerText.split(textSharpSplitReg)[1];
        placeholder = target.innerText.split(textSharpSplitReg)[2];
        isRequired = target.innerText.split(textSharpSplitReg)[0].includes("*") ? "checked" : "";
    }

    Swal.fire({
        // title: "Message",
        html: `
            <div 
                style="
                    font-size:24px;
                    text-align: start;
                    margin: 10px 0;
                    font-weight:bold;
                "
            >${TITLE}</div>
            <div style="
                text-align: start;
                font-weight:bold;
                color:#33333;
                font-size: 1.039vw;
                font-weight: 600;
            ">Title text <span style="color: red">*</span></div>
            <input 
                style="
                    box-sizing: border-box;
                    width: 100%;
                    text-indent: 0.8em;
                    height: 40px;
                    border-color: rgb(222,222,222);
                    color: rgb(51,51,51);
                    outline: none;
                    border-style: solid;
                    border-width: thin;
                    border-radius: 4px;
                    margin-top: 6px;
                "
                id="w-editor_title"
                placeholder="Enter here"
                value="${title}"
            />
            <!-- <div id="w-editor_tip" style="
                font-size: 12px;
                color: red;
                text-align: start;
                display: none
            "></div> -->
            <div style="
                text-align: start;
                margin-top: 10px;
                font-weight:bold;
                color:#33333;
                font-size: 1.039vw;
                font-weight: 600;
            ">Prompt text</div>
            <textarea 
                style="
                    box-sizing: border-box;
                    width: 100%;
                    text-indent: 0.8em;
                    min-height: 80px;
                    border-color: rgb(222,222,222);
                    color: rgb(51,51,51);
                    outline: none;
                    border-style: solid;
                    border-width: thin;
                    border-radius: 4px;
                    line-height: 40px;
                    margin-top: 6px;
                "
                id="w-editor_placeholder"
                placeholder="Enter here",
            >${placeholder}</textarea>
            <div style="
                display: flex;
                margin-top: "10px";
            ">
                <input 
                    style= "
                        width: 18px;
                        height: 18px;
                        margin-top: 2px;
                        margin-left: 2px;
                    "
                    type="checkbox"  
                    id="w-editor_require",
                    ${isRequired}
                />
                <div style="
                    width: 100%;
                    text-align: start;
                    margin-left: 10px;
                ">Required</div>
            </div>
        `,
        width: 600,
        // confirmButtonColor: '#4983d0',
        showCancelButton: true,
        showCloseButton: true,
        confirmButtonText: "Confirm",
        cancelButtonText: "Cancel",
        reverseButtons: true,
        allowOutsideClick: false,
        customClass: {
            confirmButton: "w-editor_popup_confirm",
            cancelButton: "w-editor_popup_cancel",
            closeButton: "w-editor_popup_close",
            actions: "w-editor_popup_actions",
            container: "w-editor_swal_container",
            htmlContainer: "w-e_search-container",
        },
        preConfirm: ()=>{
            let title = (<HTMLInputElement>document.getElementById("w-editor_title")).value
            let placeholder = (<HTMLInputElement>document.getElementById("w-editor_placeholder")).value
            let required = (<HTMLInputElement>document.getElementById("w-editor_require")).checked
            return {
                title: title === '' ? `Title${calc.count}` : title,
                placeholder: placeholder == '' ? 'Enter here' : placeholder,
                required
            }
        }
    }).then(res => {
        // console.log(res)
        // let html = editor.getHtml()
        let s = ''
        if(res.isConfirmed){
            // const str = res.value?.required ? '@(*)' : ''
            const str = res.value?.required ? '*' : ''
            // html = html.replace(
            //     `-editing-#[${type}:editableTitle:editableText]-editing-`,
            //     `#[${type}:${res.value?.title}${str}:${res.value?.placeholder}]`
            // )
            // s = `#[${type}:${res.value?.title}${str}:${res.value?.placeholder}]`
            s = `#${type}${str}${textSharpSplitChar}${res.value?.title}${textSharpSplitChar}${res.value?.placeholder}${textSharpSplitChar}`
            // uuidMap.setUuid(s)
            !isChange && calc.add()
            // @ts-ignore
        } else if(res.isDismissed && res.dismiss === "cancel") {
            // html = html.replace(
            //     `-editing-#[${type}:editableTitle:editableText]-editing-`,
            //     `#[${type}:editableTitle:editableText]`
            // )
            // s = `#[${type}:Title:Enter here]`
            // s = `#${type}:Title:Enter here`
            s = ``
            // @ts-ignore
        } else if(res.isDismissed && res.dismiss === "close") {
            // html = html.replace(
            //     `-editing-#[${type}:editableTitle:editableText]-editing-`,
            //     ``
            // )
            s = ''
        }
        // editor.setHtml(html)
        // editor.focus(true)

        /* text */
        // insertText(editor, s, selection)

        /* block */
        insertNode({editor, type: "sharpblock", value: s, selection, isChange})
    })


    const confirmButton = Swal.getConfirmButton()

    // const titleList = getTitleList(editor)
    // isChange && titleList.delete(formatKey(title))
    const titleInput = document.getElementById("w-editor_title") as HTMLInputElement
    const placeholderInput = document.getElementById("w-editor_placeholder") as HTMLTextAreaElement
    titleInput.focus()
    if(titleInput.value === '') {
        // Swal.disableButtons()
        confirmButton?.setAttribute("disabled", "true")
    }
    titleInput.addEventListener("input", () => {
        const title = titleInput.value
        if(title !== '') {
            titleInput.style.borderColor = "rgb(222,222,222)"
            // Swal.enableButtons()
            confirmButton?.removeAttribute("disabled")
        } else {
            titleInput.style.borderColor = "#ff0000"
            // Swal.disableButtons()
            confirmButton?.setAttribute("disabled", "true")
        }
        titleInput.value = title.replace(/\|-|-\|/g, "")
        // if(titleList.has(formatKey(title))) {
        //     // tip.style.display = "block"
        //     titleInput.style.borderColor = "#ff0000"
        //     // tip.innerText = duplicateStr
        //     // Swal.disableButtons()
        //     confirmButton?.setAttribute("disabled", "true")
        // } else if(title === '') {
        //     // tip.style.display = "block"
        //     titleInput.style.borderColor = "#ff0000"
        //     // tip.innerText = titleStr
        //     // Swal.disableButtons()
        //     confirmButton?.setAttribute("disabled", "true")
        // } else {
        //     // tip.style.display = "none"
        //     titleInput.style.borderColor = "rgb(222,222,222)"
        //     // Swal.enableButtons()
        //     confirmButton?.removeAttribute("disabled")
        // }
    })
    placeholderInput.addEventListener("input", () => {
        const placeholder = placeholderInput.value
        placeholderInput.value = placeholder.replace(/\|-|-\|/g, "")
    })
}

export {
    inputPopUp
}