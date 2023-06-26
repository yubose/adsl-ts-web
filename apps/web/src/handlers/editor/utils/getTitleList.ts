import { IDomEditor } from "@wangeditor/editor";
import formatKey from "./format";

interface REQUIRED {
    key: string
    title: string
}

const getTitleList = (editor: IDomEditor): Array<REQUIRED> => {
    const allSharp = editor.getElemsByType("sharpblock")
    // const allAt = editor.getElemsByType("atblock")
    const titleList = new Array<REQUIRED>()
    allSharp.forEach(item => {
        // @ts-ignore
        const value = item.value
        if(/#[\w*]+\|-\|[\s\S]+\|-\|[\s\S]+/.test(value)) {
            const key = value.split(/\|-\|/)[0]
            const title = value.split(/\|-\|/)[1]
            key.endsWith("*") && titleList.push({
                // @ts-ignore
                key: item.key,
                title
            })
        }
    })
    // allAt.forEach(item => {
    //     // @ts-ignore
    //     const value = item.value
    //     titleList.add(formatKey(value))
    // })
    // console.log(titleList)
    return titleList
}

export default getTitleList