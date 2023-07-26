import { getUuid } from "./utils"
import { IDomEditor } from "@wangeditor/editor"

const selectImage = (editor: IDomEditor, isMarkeable: boolean = false) => {
    const markeableInput = document.createElement('input')
    markeableInput.type = 'file'
    markeableInput.accept = 'image/*'
    markeableInput.click()
    markeableInput.onchange = () => {
        if(markeableInput.files) {
            const file = markeableInput.files[0] as File
            insertImage(editor, file, isMarkeable)
        }
    }
}

const insertImage = (editor: IDomEditor, file: File, isMarkeable = false) => {
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
                href: isMarkeable ? 'markeable' : '',
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

export { 
    selectImage,
    insertImage
}