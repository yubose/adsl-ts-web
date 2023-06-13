import { IEditorConfig } from "@wangeditor/editor"

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
                "|",
                "bold",
                // "through",
                "color",
                "bgColor",
                "clearStyle"
            ]
        }
    }
}

export default editorConfig