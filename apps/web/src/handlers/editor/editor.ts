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
        },
        image: {
            menuKeys: [
                "deleteImage"
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
        const items = event.clipboardData?.items
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
        if(items && items.length > 0) {
            try {
                for(let i = 0; i < items.length; i++) {
                    const image = items[i].getAsFile()
                    if(image) {
                        const reader = new FileReader()
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
                        reader.readAsDataURL(image)
                    }
                }
            } catch (error) {
                
            }
            return false
        }
        return true
    }
}

export default editorConfig