import { IEditorConfig, IDomEditor, SlateTransforms  } from "@wangeditor/editor"
import { getUuid } from "./utils/utils"

type InsertFnType = (url: string, alt: string, href: string) => void

const editorConfig: Partial<IEditorConfig> = {
    placeholder: 'Type here...',
    autoFocus: true,
    hoverbarKeys: {
        // link: {
        //     menuKeys: []
        // },
        text: {
            menuKeys: [
                "headerSelect",
                // "insertLink",
                // "bulletedList",
                // "|",
                // "bold",
                // // "through",
                // "color",
                // "bgColor",
                // "clearStyle"
            ]
        },
        table: {
            menuKeys: [ 
                "enter", 
                "tableHeader", 
                // "tableFullWidth",  //此处可禁用 Width auto 按钮
                "insertTableRow", 
                "deleteTableRow", 
                "insertTableCol", 
                "deleteTableCol", 
                "deleteTable"
            ]
        }
    },
    MENU_CONF: {
        table: {
            width: '100%'
        }
    },
    customPaste: (editor: IDomEditor, event: ClipboardEvent): boolean => {
        let text = event.clipboardData?.getData("text/plain")
        let image = event.clipboardData?.items?.[0].getAsFile()
        if(text && text !== "") {
            try {
                const nodes = JSON.parse(text)
                SlateTransforms.insertNodes(editor, nodes)
            } catch (error) {
                // console.log(text)
                const arr = text?.split(/[\n\r]/g)
                arr?.forEach(item => {
                    if(item !== '') {
                        editor.insertText(item)
                    }
                })
            }
            return false
        }
        if(!!image) {
            try {
                const reader = new FileReader()
                reader.onload = e => {
                    console.log(e.target?.result)
                    const node = {
                        type: "image",
                        alt: getUuid(),
                        src: e.target?.result,
                        href: '',
                        children: [
                            {text: ''}
                        ]
                    }
                    console.log("START")
                    editor.focus()
                    editor.insertNode(node)
                    console.log("END")
                }
                reader.readAsDataURL(image)
                console.log(image)
            } catch (error) {
                
            }
            return false
        }
        return true
    }
}

export default editorConfig