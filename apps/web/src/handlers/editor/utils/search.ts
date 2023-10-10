import { IDomEditor } from "@wangeditor/editor"
import Swal from "sweetalert2"
import DataSource from "../dataSource/data"
import selectTemplate from "./selectTemplate"
import { insertNode, toReg } from "./utils"

const dismiss = new Set(["backdrop", "esc"])

const searchPopUp = ({ 
    editor,
    selection,
    isChange = false,
    isUseHotKey = false
}:{
    editor: IDomEditor, 
    selection, 
    isChange?: boolean, 
    isUseHotKey?: boolean
}) => {   
    Swal.fire({
        html: `
            <div>
                <div 
                    style="
                        font-size:24px;
                        text-align: start;
                        margin: 10px 0;
                        font-weight:bold;
                    "
                >Dynamic Fields</div>
                <div style="
                    box-sizing: border-box;
                    width: 100%;
                    height: 40px;
                    border-color: rgb(222,222,222);
                    color: rgb(51,51,51);
                    border-style: solid;
                    border-width: thin;
                    border-radius: 4px;
                    display: flex;
                ">
                    <div style="
                        width: 8%;
                        height: 100%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    ">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16.85" height="16.85" viewBox="0 0 16.85 16.85">
                            <g id="组_22123" data-name="组 22123" transform="translate(-33 -253)">
                                <g id="椭圆_665" data-name="椭圆 665" transform="translate(33 253)" fill="none" stroke="#c1c1c1" stroke-width="1.2">
                                <ellipse cx="7.638" cy="7.638" rx="7.638" ry="7.638" stroke="none"/>
                                <ellipse cx="7.638" cy="7.638" rx="7.038" ry="7.038" fill="none"/>
                                </g>
                                <path id="路径_9548" data-name="路径 9548" d="M3932.215,265.438l3.224,3.224" transform="translate(-3886.437 0.339)" fill="none" stroke="#c1c1c1" stroke-linecap="round" stroke-width="1.2"/>
                            </g>
                        </svg>
                    </div>
                    <input 
                        id="w-e_search-search"
                        placeholder="Search dynamic field"
                        style="
                            width: 90%;
                            border: none;
                            outline: none;
                        ",
                        value=""
                    />
                </div>
                <div id="w-e_search-box">
                    <div id="w-e_search-title" class="w-e_search-display">
                        <div class="title title0">Abbrew</div>
                        <div class="title title1">Expansion</div>
                    </div>
                    <div id="w-e_search-content" class="w-e_search-display"></div>
                </div>
            </div>
        `,
        customClass: {
            htmlContainer: "w-e_search-container",
            closeButton: "w-editor_popup_close",
            container: "w-editor_swal_container"
        },
        showCloseButton: true,
        width: 600,
        showConfirmButton: false,
        allowOutsideClick: false
    }).then(res => {
        // console.log(res)
        // @ts-ignore
        if(res.isDismissed && dismiss.has(res.dismiss)) {
            // let html = editor.getHtml()
            // html = html.replace(`-editing-@[]-editing-`, ``)
            // editor.setHtml(html)
        }
    })
    const input = document.getElementById("w-e_search-search") as HTMLInputElement
    const content = document.getElementById("w-e_search-content") as HTMLDivElement
    input.focus()
    if(input.value === '') {
        const res = search(input.value)
        content.innerHTML = res;
    }
    input.addEventListener("input", () => {
        const text = input.value.replace(/@/g, '')
        const res = search(text)
        content.innerHTML = res;
    })
    content.addEventListener("click", (event) => {
        // @ts-ignore
        const key = event.target.parentElement.dataset["key"]
        // @ts-ignore
        const isSharp = event.target.parentElement.dataset["issharp"]
        if(key) {
            Swal.close()
            try {
                if(isUseHotKey){
                    editor.focus()
                    editor.select(selection)
                    editor.deleteBackward("character")
                    selection = editor.selection
                }
                /* text */
                // insertText(editor, `@[${key}]`, selection)
                
                /* block */
                // insertNode(editor, "atblock", `@${key}`, selection, isChange)

                if(isSharp === "true") {
                    // insertNode(editor, "sharpblock", `#${key}`, selection)
                    selectTemplate(editor, key)
                } else {
                    insertNode({editor, type:"atblock", value:`@${key}`, selection, isChange})
                }
                
                // let html = editor.getHtml()
                // html = html.replace(`-editing-@[]-editing-`, `@[${key}]`)
                // console.log(html)
                // editor.setHtml(html)
                // editor.focus(true)
            } catch (error) {
                console.log(error)
            }
            
        }
    })
}

const search = (value: string) => {
    const Reg = new RegExp(toReg(value), 'i')
    // console.log(Reg)
    let obj = new Object()
    // let res = new Array()
    let res = ''
    DataSource.forEach((value, key) => {
        if(Reg.test(key)) {
            // res.push(`
            //     <div class="w-e_search-item" data-key="${key}" data-source="${value.Source}">
            //         <div class="title title0">${key}</div>
            //         <div class="title title1">${value.Expansion}</div>
            //     </div>
            // `)
            obj[key] = `
                <div class="w-e_search-item" data-key="${key}" data-source="${value.Source}" data-issharp=${value.isSharp}>
                    <div class="title title0">
                        <p class="text">${key}</p>
                    </div>
                    <div class="title title1">
                        <p class="text">${value.Expansion}</p>
                    </div>
                </div>
            `
        }
    })
    const arr = Object.keys(obj).sort()
    arr.forEach(item => {
        res += obj[item]
    })
    // res.length > 5 && res.splice(5)
    return res
    // return res.join('')
}

export default searchPopUp