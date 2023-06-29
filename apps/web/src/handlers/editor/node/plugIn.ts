import { DomEditor, IDomEditor, SlateElement } from "@wangeditor/editor";
import Swal from "sweetalert2";
import DataSource from "../dataSource/data"
import getTitleList from "../utils/getTitleList";

function withBlock<T extends IDomEditor>(editor: T) {
    const { isInline, isVoid, insertNode, insertText } = editor
    const newEditor = editor

    newEditor.isInline = elem => {
        const type = DomEditor.getNodeType(elem)
        if(type === "atblock") return true
        if(type === "sharpblock") return false
        // if(type === "infoblock") return true
        return isInline(elem)
    }

    newEditor.isVoid = elem => {
        const type = DomEditor.getNodeType(elem)
        if(type === "atblock") return true
        if(type === "sharpblock") return true
        // if(type === "infoblock") return true
        return isVoid(elem) 
    } 
    
    // newEditor.insertNode = async elem => {
    //     const type = DomEditor.getNodeType(elem)
    //     const titleTipPopup = async (title) => {
    //         return await Swal.fire({
    //             html: `
    //                 <div 
    //                     style="
    //                         font-size:24px;
    //                         text-align: start;
    //                         margin: 10px 0;
    //                         font-weight:bold;
    //                     "
    //                 >Single line input box</div>
    //                 <div style="
    //                     text-align: start;
    //                     font-weight:bold;
    //                     color:#33333;
    //                     font-size: 1.039vw;
    //                     font-weight: 600;
    //                 ">Title text</div>
    //                 <input 
    //                     style="
    //                         box-sizing: border-box;
    //                         width: 100%;
    //                         text-indent: 0.8em;
    //                         height: 40px;
    //                         border-color: rgb(222,222,222);
    //                         color: rgb(51,51,51);
    //                         outline: none;
    //                         border-style: solid;
    //                         border-width: thin;
    //                         border-radius: 4px;
    //                         margin-top: 6px;
    //                     "
    //                     id="w-editor_title"
    //                     placeholder="Enter here",
    //                     value="${title}"
    //                 />
    //             `,
    //             width: 600,
    //             // confirmButtonColor: '#4983d0',
    //             showCancelButton: true,
    //             showCloseButton: true,
    //             confirmButtonText: "Confirm",
    //             cancelButtonText: "Cancel",
    //             reverseButtons: true,
    //             allowOutsideClick: false,
    //             customClass: {
    //                 confirmButton: "w-editor_popup_confirm",
    //                 cancelButton: "w-editor_popup_cancel",
    //                 closeButton: "w-editor_popup_close",
    //                 actions: "w-editor_popup_actions",
    //                 container: "w-editor_swal_container"
    //             },
    //             preConfirm: ()=>{
    //                 let title = (<HTMLInputElement>document.getElementById("w-editor_title")).value
    //                 return {
    //                     title: title === '' ? 'Title' : title
    //                 }
    //             }      
    //         })
    //     }
    //     if(type === "sharpblock") {
    //         // @ts-ignore
    //         const value = elem.value
    //         const titleList = getTitleList(editor)
    //         if(/#[\w*]+:[^:]+:[^:]+/.test(value)) {
    //             const title = value.split(/:/)[1]
    //             if(titleList.has(title)) {
    //                 // 弹窗提醒
    //                 // alert("ERROR")
    //                 let res = await titleTipPopup(title)
    //                 const newElem = {
    //                     type: type,
    //                     value: value.replace(`:${title}:`, `:${res.value?.title}:`),
    //                     children: [
    //                         {text: ''}
    //                     ]
    //                 }
    //                 titleList.add(res.value?.title)
    //                 return insertNode(newElem)
    //             } else {
    //                 titleList.add(title)
    //             }
    //         }
    //         return insertNode(elem)
    //     }
    //     return insertNode(elem)
    // }

    return newEditor
}

export default withBlock