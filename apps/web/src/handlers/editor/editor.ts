import { IEditorConfig, IDomEditor } from "@wangeditor/editor"

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