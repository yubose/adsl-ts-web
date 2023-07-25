import { IDomEditor, SlateTransforms } from "@wangeditor/editor"
import choice from "./choice"
import dateAndTime from "./dateAndtime"
import { deepCopy } from "./deepCopy"
import { FacilityInfo, PatientInfo, ProviderInfo } from "./info"
import { inputPopUp } from "./popUp"
import { getUuid, insertNode } from "./utils"

const selectTemplate = (editor: IDomEditor, value: string | boolean) => {
    const selection = editor.selection
    switch(value) {
        case "TextView":
            // editor.insertText(`-editing-#[textView:editableTitle:editableText]-editing
            inputPopUp(editor, value, selection)
            break
        case "TextField":
            // editor.insertText(`-editing-#[textField:editableTitle:editableText]-editing-`)
            inputPopUp(editor, value, selection)
            break
        // case "Signature":
        //     insertNode({editor, type: "sharpblock", value: `#${value}`, selection})
        //     break
        case "Provider Signature":
            insertNode({editor, type: "sharpblock", value: `#${value}`, selection})
            break
        case "Patient/Guardian Signature":
            insertNode({editor, type: "sharpblock", value: `#${value}`, selection})
            break
        case "Diagnosis":
            insertNode({editor, type: "sharpblock", value: `#${value}`, selection})
            break
        case "Choice":
            choice({
                editor,
                selection
            })
            break
        case "FacilityInfo":
        case "Facility info":
            editor.focus()
            // @ts-ignore
            editor.select(selection)
            SlateTransforms.insertNodes(editor, deepCopy(FacilityInfo), {
                voids: true
            })
            editor.insertBreak()
            break
        case "PatientInfo":
        case "Patient info":
            editor.focus()
            // @ts-ignore
            editor.select(editor.selection)
            SlateTransforms.insertNodes(editor, deepCopy(PatientInfo), {
                voids: true
            })
            editor.insertBreak()
            
            break
        case "ProviderInfo":
        case "Provider info":
            editor.focus()
            // @ts-ignore
            editor.select(editor.selection)
            SlateTransforms.insertNodes(editor, deepCopy(ProviderInfo), {
                voids: true
            })
            editor.insertBreak()
            
            break
        case "Date&Time":
            dateAndTime({
                editor,
                selection
            })
            break
        case "Image": 
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'image/*'
            input.click()
            input.onchange = () => {
                // console.log(input.files)
                if(input.files) {
                    const file = input.files[0] as File
                    const reader = new FileReader
                    reader.onload = e => {
                        const src = e.target?.result as string
                        const imageObj = new Image()
                        imageObj.src = src
                        imageObj.onload = () => {
                            const node = {
                                type: "image",
                                alt: getUuid(),
                                src: e.target?.result,
                                href: '',
                                children: [
                                    {text: ''}
                                ],
                                style: {
                                    width: imageObj.width + 'px',
                                    height: imageObj.height + 'px'
                                }
                            }
                            editor.insertNode(node)
                        }
                    }
                    reader.readAsDataURL(file)
                }
            }
            break
        case "Image(Markeable)": 
            const markeableInput = document.createElement('input')
            markeableInput.type = 'file'
            markeableInput.accept = 'image/*'
            markeableInput.click()
            markeableInput.onchange = () => {
                // console.log(markeableInput.files)
                if(markeableInput.files) {
                    const file = markeableInput.files[0] as File
                    const reader = new FileReader
                    reader.onload = e => {
                        const src = e.target?.result as string
                        const imageObj = new Image()
                        imageObj.src = src
                        imageObj.onload = () => {
                            const node = {
                                type: "image",
                                alt: getUuid(),
                                src: e.target?.result,
                                href: 'markeable',
                                children: [
                                    {text: ''}
                                ],
                                style: {
                                    width: imageObj.width + 'px',
                                    height: imageObj.height + 'px'
                                }
                            }
                            editor.insertNode(node)
                        }
                    }
                    reader.readAsDataURL(file)
                }
            }
            break
        default:
            insertNode({editor, type: "sharpblock", value: `#${value}`, selection})
            break
    }
}

export default selectTemplate