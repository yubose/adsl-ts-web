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
    allImage.forEach((image: ImageElement) => { 
        imageList.push({
            key: image.alt,
            value: image.src
        })
    })
    return imageList
}

export default getImageList