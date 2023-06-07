import { IDomEditor } from "@wangeditor/editor"
import Swal from "sweetalert2"
import { SharpType } from "./config"
import { insertText } from "./utils"

const inputPopUp = (editor: IDomEditor, type: SharpType, selection) => {
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
            >Single line input box</div>
            <div style="
                text-align: start;
                font-weight:bold;
                color:#33333;
                font-size: 1.039vw;
                font-weight: 600;
            ">Title text</div>
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
                "
                id="w-editor_title"
                placeholder="Enter here"
            />
            <div style="
                text-align: start;
                margin-top: 10px;
                font-weight:bold;
                color:#33333;
                font-size: 1.039vw;
                font-weight: 600;
            ">Placeholder</div>
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
                "
                id="w-editor_placeholder"
                placeholder="Enter here"
            ></textarea>
            <div style="
                display: flex;
            ">
                <input 
                    style= "
                        width: 20px;
                        height: 20px;
                        margin-top: 2px;
                        margin-left: 2px;
                    "
                    type="checkbox"  
                    id="w-editor_require"
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
        customClass: {
            confirmButton: "w-editor_popup_confirm",
            cancelButton: "w-editor_popup_cancel",
            closeButton: "w-editor_popup_close",
            actions: "w-editor_popup_actions"
        },
        preConfirm: ()=>{
            let title = (<HTMLInputElement>document.getElementById("w-editor_title")).value
            let placeholder = (<HTMLInputElement>document.getElementById("w-editor_placeholder")).value
            let required = (<HTMLInputElement>document.getElementById("w-editor_require")).checked
            return {
                title: title === '' ? 'editableTitle' : title,
                placeholder: placeholder == '' ? 'editableText' : placeholder,
                required
            }
        }
    }).then(res => {
        // console.log(res)
        // let html = editor.getHtml()
        let s = ''
        if(res.isConfirmed){
            const str = res.value?.required ? '@(*)' : ''
            // html = html.replace(
            //     `-editing-#[${type}:editableTitle:editableText]-editing-`,
            //     `#[${type}:${res.value?.title}${str}:${res.value?.placeholder}]`
            // )
            s = `#[${type}:${res.value?.title}${str}:${res.value?.placeholder}]`
            // @ts-ignore
        } else if(res.isDismissed && res.dismiss === "cancel") {
            // html = html.replace(
            //     `-editing-#[${type}:editableTitle:editableText]-editing-`,
            //     `#[${type}:editableTitle:editableText]`
            // )
            s = `#[${type}:editableTitle:editableText]`
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
        insertText(editor, s, selection)
    })
}

export {
    inputPopUp
}