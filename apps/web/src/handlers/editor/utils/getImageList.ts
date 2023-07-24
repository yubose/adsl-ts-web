import { IDomEditor } from "@wangeditor/editor";
import { SlateElement } from '@wangeditor/editor'

type ImageElement = SlateElement & {
    id: string  //属性此处方法不存在，为规避类型报错设置
    src: string
    alt: string
    url: string
    href: string
}

interface Image {
    key: string
    value: string
}

const getImageList = (editor: IDomEditor) => {
    const allImage = editor.getElemsByType('image') as ImageElement[]
    const imageList = new Array<Image>()
    const imageOptions = new Object()
    allImage.forEach((image: ImageElement) => { 
        imageList.push({
            key: image.alt,
            value: image.src
        })
        if(image.href !== '') {
            imageOptions[image.alt] = {
                fileName: "",
                imgPath: ""
            }
        }
    })
    return {
        imageList,
        imageOptions
    }
}

export default getImageList