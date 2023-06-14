import { IDomEditor } from "@wangeditor/editor";
import formatKey from "./format";

const getTitleList = (editor: IDomEditor) => {
    const allSharp = editor.getElemsByType("sharpblock")
    // const allAt = editor.getElemsByType("atblock")
    const titleList = new Set()
    allSharp.forEach(item => {
        // @ts-ignore
        const value = item.value
        if(/#[\w*]+:[^:]+:[^:]+/.test(value)) {
            const title = value.split(/:/)[1]
            titleList.add(formatKey(title))
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