import { IEditorConfig, IDomEditor } from "@wangeditor/editor"

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
        const text = event.clipboardData?.getData("text/plain")
        if(text !== "") {
            const arr = text?.split(/[\n\r]/g)
            arr?.forEach(item => {
                if(item !== '') {
                    editor.insertText(item)
                    editor.insertBreak()
                }
            })
            return false
        } else {
            return true
        }
    }
}

export default editorConfig