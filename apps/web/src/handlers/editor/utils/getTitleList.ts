import { IDomEditor } from "@wangeditor/editor";
import formatKey from "./format";
import { choiceSharpReg, textSharpReg, textSharpSplitReg } from "./textSharp";
import { editorBlockSet } from "./utils";

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
        if(textSharpReg.test(value)) {
            const key = value.split(textSharpSplitReg)[0]
            const title = value.split(textSharpSplitReg)[1]
            key.endsWith("*") && titleList.push({
                // @ts-ignore
                key: item.key,
                title
            })
        } else if(choiceSharpReg.test(value)) {
            const key = value.split(textSharpSplitReg)[0]
            const title = value.split(textSharpSplitReg)[1]
            if(editorBlockSet.choiceSet.has(key.replace(/[#*]/g, ''))) {
                if(!key.includes("Checkbox")) {
                    key.endsWith("*") && titleList.push({
                        // @ts-ignore
                        key: `${item.key}.value`,
                        title
                    })
                } else {
                    key.endsWith("*") && titleList.push({
                        // @ts-ignore
                        key: `${item.key}.valueList`,
                        title
                    })
                }
            } else if(editorBlockSet.dateTimeSet.has(key.replace(/[#*]/g, ''))) {
                const id = key.replace(/[#*]/g, '')
                switch(id) {
                    case "Date":
                        key.endsWith("*") && titleList.push({
                            // @ts-ignore
                            key: `${item.key}.Date`,
                            title
                        })
                        break
                    case "Time":
                        key.endsWith("*") && titleList.push({
                            // @ts-ignore
                            key: `${item.key}.Time`,
                            title
                        })
                        break
                    case "Date&Time": 
                        if(key.endsWith("*")){
                            titleList.push({
                                // @ts-ignore
                                key: `${item.key}.Date`,
                                title: title + "(Date)"
                            })
                            titleList.push({
                                // @ts-ignore
                                key: `${item.key}.Time`,
                                title: title + "(Time)"
                            })
                        }
                        break
                    default:
                        break
                }
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