import { IDomEditor } from "@wangeditor/editor";
import { choiceSharpReg, textSharpSplitReg } from "./textSharp";
import { editorBlockSet } from "./utils";

const getDateAndTime = (editor: IDomEditor): Array<any> => {
    const allSharp = editor.getElemsByType("sharpblock")
    const res = new Array<any>()
    allSharp.forEach(item => {
        // @ts-ignore
        const value = item.value
        const key = value.split(textSharpSplitReg)[0].replace(/[#*\$]/g, '')
        // @ts-ignore
        const id = item.key
        if(choiceSharpReg.test(value) && editorBlockSet.dateTimeSet.has(key) && key !== "Time") {
            const Assignment = {}
            Assignment[`..formData.data.`+ id + `.Date@`] = '=..formData.data.DataAndTime.value'
            res.push({
                if: [
                    {
                        "=.builtIn.string.equal": {
                            dataIn: {
                                string1: "=..formData.data.DataAndTime.flag",
                                string2: id + "Tag"
                            }
                        }
                    },
                    Assignment,
                    "continue"
                ]
            })
            if(key === "Date&Time") {
                res.push({
                    if: [
                        {
                            "=.builtIn.string.equal": {
                                dataIn: {
                                    string1: "=..formData.data.DataAndTime.flag",
                                    string2: id + "Tag"
                                }
                            }
                        },
                        {
                            "=.builtIn.array.clear": {
                                dataIn: {
                                    object: "=..formData.data." + id + ".DateAndTime"
                                }
                            }
                        },
                        "continue"
                    ]
                })
                res.push({
                    if: [
                        {
                            "=.builtIn.string.equal": {
                                dataIn: {
                                    string1: "=..formData.data.DataAndTime.flag",
                                    string2: id + "Tag"
                                }
                            }
                        },
                        {
                            "=.builtIn.array.add": {
                                dataIn: {
                                    object: "=..formData.data." + id + ".DateAndTime",
                                    value: "=..formData.data." + id + ".Date"
                                }
                            }
                        },
                        "continue"
                    ]
                })
                res.push({
                    if: [
                        {
                            "=.builtIn.string.equal": {
                                dataIn: {
                                    string1: "=..formData.data.DataAndTime.flag",
                                    string2: id + "Tag"
                                }
                            }
                        },
                        {
                            "=.builtIn.array.add": {
                                dataIn: {
                                    object: "=..formData.data." + id + ".DateAndTime",
                                    value: "=..formData.data." + id + ".Time"
                                }
                            }
                        },
                        "continue"
                    ]
                })
            }
            res.push({
                if: [
                    {
                        "=.builtIn.string.equal": {
                            dataIn: {
                                string1: "=..formData.data.DataAndTime.flag",
                                string2: id + "Tag"
                            }
                        }
                    },
                    {
                        actionType: "builtIn",
                        funcName: "redraw",
                        viewTag: id + "Tag"
                    },
                    "continue"
                ]
            })
        }
    })
    return res
}

export { 
    getDateAndTime
}