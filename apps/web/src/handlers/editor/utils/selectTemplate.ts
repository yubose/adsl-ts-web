import { IDomEditor, SlateTransforms } from "@wangeditor/editor"
import choice from "./choice"
import dateAndTime from "./dateAndtime"
import { deepCopy } from "./deepCopy"
import { FacilityInfo, PatientInfo, ProviderInfo } from "./info"
import { inputPopUp } from "./popUp"
import { selectImage } from "./selectFile"
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
            selectImage(editor)
            break
        case "Image(Markeable)": 
            selectImage(editor, true)
            break
        case "TextShort":
            const TextShort = {
                "type": "atblock",
                "value": "@Input Box(Short)",
                "children": [
                    {
                        "text": ""
                    }
                ]
            }
            editor.insertNode(TextShort)
            break
        default:
            insertNode({editor, type: "sharpblock", value: `#${value}`, selection})
            break
    }
}

export default selectTemplate