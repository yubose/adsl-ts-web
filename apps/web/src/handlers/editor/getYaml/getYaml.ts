import { IDomEditor } from "@wangeditor/editor";
// import atMap from "../formDataMap/atMap";
import { deepCopy } from "../utils/deepCopy";
import BaseJson from "./BaseJson";
import * as yaml from "yaml"
import sharpYaml from "./sharpYaml";
import { SharpType } from "../utils/config";
// import DataSource from "../dataSource/data";
import formatKey from "../utils/format";

const getYaml = (editor: IDomEditor) => {
    try {
        let BaseJsonCopy = deepCopy(BaseJson)
        const json = editor.children
        let jsonFix = fixJson(json, BaseJsonCopy)

        BaseJsonCopy.components = jsonFix

        return {
            data: BaseJsonCopy.formData,
            components: BaseJsonCopy.components
        }

        // return {
        //     data: yaml.stringify(BaseJsonCopy.formData),
        //     components: yaml.stringify(BaseJsonCopy.components)
        // }
        
    } catch (error) {
        console.log(error)
    }
    
}

const typeConfig = new Map([
    ["paragraph", "view"]
    // ["paragraph", "label"]
])

const styleConfig = new Map([
    ["color", "color"],
    ["bgColor", "backgroundColor"],
    ["bold", '{"fontWeight": "bold"}'],
    ["italic", '{"fontStyle": "italic"}'],
    ["underline", '{"textDecoration": "underline"}'],
])

const colorReg = /rgb\((.)+\)/
const RefReg = /(@\[[\w '\(\)]+\]|#\[\w+:[^:]+:[^:]+\]|@\[[^:]+:\w+\])/g
const Reg = /@\[[\w '\(\)]+\]|#\[\w+:[^:]+:[^:]+\]/
const AtSplitReg = /[@\[\]]/g
const SharpSplitReg = /[@#\[\]]/g
const AtReg = /@\[[\w '\(\)]+\]/
const SharpTypeReg = /#\[\w+:[^:]+:[^:]+\]/
// const AtTemplateReg = /@\[[^:]+:\w+\]/


const fixJson = (json, BaseJsonCopy) => {
    return populate(json, BaseJsonCopy).target
}

const populate = (obj, BaseJsonCopy) => {
    let target
    let isConcat = false
    if(obj instanceof Array) {
        target = []
        obj.forEach(item => {
            const res = populate(item, BaseJsonCopy)
            if(res.isConcat) {
                target = [...target, ...res.target]
            } else {
                target.push(res.target)
            }
        })
    } else if(typeof obj === 'object' && obj !== null) {
        target = {}
        if("type" in obj) {
            target.type = typeConfig.get(obj.type)
            target.style = {
                marginTop: "15px",
                marginBottom: "15px"
            }
            target.children = populate(obj.children, BaseJsonCopy).target
        } else {
            if(Reg.test(obj.text)) {
                isConcat = true
                target = []
                const arr = obj.text.split(RefReg)
                // console.log(arr)
                arr.forEach(item => {
                    if(item !== '') {
                        let txt = { text: item }
                        target.push(oprate(Object.assign({}, obj, txt), BaseJsonCopy))
                    }
                })
            } else {
                target = oprate(obj, BaseJsonCopy)
            }
        }
    }
    return {
        target: target,
        isConcat: isConcat
    }
}

const oprate = (obj, BaseJsonCopy) => {
    let target = {}
    if(AtReg.test(obj.text)){
        const KEY = formatKey(obj.text.replace(AtSplitReg, ''))
        BaseJsonCopy.formData[KEY] = ``
        target = {
            type: "view",
            children: [
                {
                    type: "textField",
                    dataKey: "formData.data." + KEY,
                    value: "formData.data." + KEY,
                    placeholder: KEY,
                    style: {
                        display: `=..formData.atrribute._isEdit`,
                        width: "200px",
                        height: "40px",
                        boxSizing: "border-box",
                        textIndent: "0.8em",
                        borderColor: "#DEDEDE",
                        color: "#333333",
                        outline: "none",
                        borderStyle: "solid",
                        borderWidth: "thin",
                        borderRadius: "4px",
                        lineHeight: "40px"
                    }
                },
                {
                    type: "view",
                    text: "..formData.data." + KEY,
                    style: {
                        display: "=..formData.atrribute._isRead",
                        height: "40px",
                        lineHeight: "40px"
                    } 
                }
            ]
        }
        
    }
    else if(SharpTypeReg.test(obj.text)) {
        const text = obj.text.replace(SharpSplitReg, '')
        const splitArr = text.split(/:/g)
        let required = false
        let title = splitArr[1]
        if(/@\(\*\)/.test(obj.text)) {
            required = true
            title = splitArr[1].replace(/\(\*\)/, '')
        }
        BaseJsonCopy.formData[formatKey(title)] = ``
        target = sharpYaml({
            type: splitArr[0] as SharpType,
            config: {
                title: title,
                placeholder: splitArr[2]
            },
            isRequired: required
        })
        // target = {
        //     type: "view",
        //     style: {
        //         width: "calc(92%)",
        //         margin: "auto"
        //     },
        //     children: [
        //         {
        //             type: "view",
        //             text: text
        //         },
        //         {
        //             type: "textView",
        //             dataKey: "formData." + text,
        //             style: {
        //                 display: `=..formData._isProvider`,
        //                 minHeight: "80px",
        //                 width: "calc(100%)"
        //             }
        //         },
        //         {
        //             type: "view",
        //             text: "..formData." + text,
        //             style: {
        //                 display: "=..formData._isPatient",
        //                 wordWrap: "break-word"
        //             } 
        //         }
        //     ]
        // }
        return target
    }
    // else if(AtTemplateReg.test(obj.text)) {
    //     const text = obj.text.replace(splitReg, '')
    //     const title = text.split(":")[0]
    //     const key = text.split(":")[1]
    //     BaseJsonCopy.formData[key] = `${title}`
    //     target = {
    //         type: "view",
    //         style: {
    //             display: "grid",
    //             // gridTemplateColumns: `${title.length*10}px 200px`
    //             gridTemplateColumns: `200px 200px`
    //         },
    //         children: [
    //             {
    //                 type: "view",
    //                 text: title
    //             },
    //             {
    //                 type: "textField",
    //                 dataKey: "formData." + key,
    //                 style: {
    //                     display: `=..formData._isProvider`
    //                 }
    //             },
    //             {
    //                 type: "view",
    //                 text: "..formData." + key,
    //                 style: {
    //                     display: "=..formData._isPatient"
    //                 } 
    //             }
    //         ]
    //     }
    // }
    else {
        target["type"] = "label"
        target["text"] = obj.text
        target = {
            type: "label",
            text: obj.text,
            style: {
                height: "40px",
                lineHeight: "40px"
            }
        }
    }
    if(!("style" in target)) {
        target["style"] = {
            display: "inline-block",
            whiteSpace: "pre"
        }
    } else {
        target.style = Object.assign(target.style as {}, {
            display: "inline-block",
            whiteSpace: "pre"
        })
    }
    
    Object.keys(obj).forEach(key => {
        if(key !== "text") {
            if(typeof obj[key] === "boolean") {
                console.log(key, styleConfig.get(key))
                target["style"] = Object.assign(target["style"], JSON.parse(styleConfig.get(key) as string))
            } else if(colorReg.test(obj[key])) {
                target["style"][styleConfig.get(key)] = rgb2hex(obj[key])
            }
        }
    })
    if(Object.keys(target["style"]).length === 0) delete target["style"]
    return target
}

const rgb2hex = (rgb) => {
    const arr = rgb.replace(/[rgb( )]/g, '').split(',')
    let hex = '0x'
    arr.forEach(item => {
        hex += parseInt(item).toString(16)
    })
    return hex
}

export default getYaml