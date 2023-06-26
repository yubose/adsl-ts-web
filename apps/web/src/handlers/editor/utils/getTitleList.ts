import { IDomEditor } from "@wangeditor/editor";
import formatKey from "./format";

const getTitleList = (editor: IDomEditor, isRequired = false): Set<string> => {
    const allSharp = editor.getElemsByType("sharpblock")
    // const allAt = editor.getElemsByType("atblock")
    const titleList = new Set<string>()
    allSharp.forEach(item => {
        // @ts-ignore
        const value = item.value
        if(/#[\w*]+\|-\|[\s\S]+\|-\|[\s\S]+/.test(value)) {
            const key = value.split(/\|-\|/)[0]
            const title = value.split(/\|-\|/)[1]
            if(isRequired) {
                key.endsWith("*") && titleList.add(title)
            } else {
                titleList.add(formatKey(title))
            }
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