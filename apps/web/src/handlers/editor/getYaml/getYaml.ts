import { IDomEditor } from "@wangeditor/editor";
// import atMap from "../formDataMap/atMap";
import { deepCopy } from "../utils/deepCopy";
import BaseJson from "./BaseJson";
import * as yaml from "yaml"
import sharpYaml from "./sharpYaml";
import { SharpType } from "../utils/config";
// import DataSource from "../dataSource/data";
import formatKey from "../utils/format";
import { facilityInfoYaml } from "../dataSource/infoYaml";

const getYaml = (editor: IDomEditor) => {
    try {
        let BaseJsonCopy = deepCopy(BaseJson)
        const json = editor.children
        let jsonFix = fixJson(json, BaseJsonCopy)

        BaseJsonCopy.components = jsonFix

        // console.log(yaml.stringify(BaseJsonCopy.formData))
        // console.log(yaml.stringify(BaseJsonCopy.components))

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
    ["paragraph", "view"],
    ["header1", "view"],
    ["header2", "view"],
    ["header3", "view"],
    ["header4", "view"],
    ["header5", "view"],
    ["divider", "divider"]
    // ["paragraph", "label"]
])

const typeStyle = new Map([
    ["header1", {
        fontSize: "=..formData.atrribute.noodl_font.h1",
        marginBlockStart: "0.67em",
        // marginBlockEnd: "0.67em",
        marginInlineStart: "0px",
        // marginInlineEnd: "0px",
        fontWeight: 700
    }],
    ["header2", {
        fontSize: "=..formData.atrribute.noodl_font.h2",
        marginBlockStart: "0.83em",
        // marginBlockEnd: "0.83em",
        marginInlineStart: "0px",
        // marginInlineEnd: "0px",
        fontWeight: 700
    }],
    ["header3", {
        fontSize: "=..formData.atrribute.noodl_font.h3",
        marginBlockStart: "1em",
        // marginBlockEnd: "1em",
        marginInlineStart: "0px",
        // marginInlineEnd: "0px",
        fontWeight: 700
    }],
    ["header4", {
        fontSize: "=..formData.atrribute.noodl_font.h4",
        marginBlockStart: "1.33em",
        // marginBlockEnd: "1.33em",
        marginInlineStart: "0px",
        // marginInlineEnd: "0px",
        fontWeight: 700
    }],
    ["header5", {
        fontSize: "=..formData.atrribute.noodl_font.h5",
        marginBlockStart: "1.67em",
        // marginBlockEnd: "1.67em",
        marginInlineStart: "0px",
        // marginInlineEnd: "0px",
        fontWeight: 700
    }],
    ["divider", {
        color: "0x9a9a9a"
    }]
])

const styleConfig = new Map([
    ["color", "color"],
    ["bgColor", "backgroundColor"],
    ["bold", '{"fontWeight": "700"}'],
    ["italic", '{"fontStyle": "italic"}'],
    ["underline", '{"textDecoration": "underline"}'],
    ["indent", '{"marginLeft": "__REPLACE__"}'],
    ["textAlign", '{"display": "flex", "justifyContent": "__REPLACE__", "textAlign": "__REPLACE__"}']
])

const SkipType = new Set(["divider"])

const colorReg = /rgb\((.)+\)/
const RefReg = /(@\[[\w '\(\)]+\]|#\[\w+:[^:]+:[^:]+\]|#\[\w+\])/g
const Reg = /@\[[\w '\(\)]+\]|#\[\w+:[^:]+:[^:]+\]|#\[\w+\]/
const AtSplitReg = /[@\[\]]/g
const SharpSplitReg = /[@#\[\]]/g
const AtReg = /@\[[\w '\(\)]+\]/
const SharpTypeReg = /#\[\w+:[^:]+:[^:]+\]/
const SharpReg = /#\[\w+\]/
// const AtTemplateReg = /@\[[^:]+:\w+\]/


const fixJson = (json, BaseJsonCopy) => {
    // return populate(json, BaseJsonCopy).target
    return populateBlock(json, BaseJsonCopy)
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
                width: "calc(100%)",
                marginTop: "15px",
            }
            if(typeStyle.has(obj.type)) {
                target.style = Object.assign(target.style, typeStyle.get(obj.type))
            }
            Object.keys(obj).forEach(key => {
                if(styleConfig.has(key)) {
                    target.style = Object.assign(target.style, JSON.parse(styleConfig.get(key)?.replace(/__REPLACE__/g, obj[key]) as string))
                }
            })
            if(!SkipType.has(obj.type)) {
                target.children = populate(obj.children, BaseJsonCopy).target
            }
        } else {
            if(Reg.test(obj.text)) {
                isConcat = true
                target = []
                const arr = obj.text.split(RefReg)
                arr.forEach(item => {
                    if(item !== '') {
                        let txt = { text: item }
                        target.push(oprate(Object.assign({}, obj, txt), BaseJsonCopy))
                    }
                })
            } else if(obj.text !== '') {
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
                        display: `=..formData.atrribute.is_edit`,
                        width: "200px",
                        height: "40px",
                        boxSizing: "border-box",
                        textIndent: "0.8em",
                        color: "#333333",
                        outline: "none",
                        border: "1px solid #DEDEDE",
                        // borderColor: "#DEDEDE",
                        // borderStyle: "solid",
                        borderWidth: "thin",
                        borderRadius: "4px",
                        lineHeight: "40px"
                    }
                },
                {
                    type: "view",
                    text: "=..formData.data." + KEY,
                    style: {
                        display: "=..formData.atrribute.is_read",
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
    else if(SharpReg.test(obj.text)) {
        const text = obj.text.replace(SharpSplitReg, '')
        switch(text) {
            case "FacilityInfo": 
                return facilityInfoYaml
            case "PatientInfo":
            case "ProviderInfo":
            default: 
                return {}
        }
    }
    else {
        // target["type"] = "label"
        // target["text"] = obj.text
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
                target["style"] = Object.assign(target["style"], JSON.parse(styleConfig.get(key) as string))
            } else if(colorReg.test(obj[key])) {
                target["style"][styleConfig.get(key)] = rgb2hex(obj[key])
            }
        }
    })
    if(Object.keys(target["style"]).length === 0) delete target["style"]
    return target
}

const populateBlock = (obj, BaseJsonCopy) => {
    let target
    if(obj instanceof Array) {
        target = []
        obj.forEach(item => {
            target.push(populateBlock(item, BaseJsonCopy))
        })
    } else if(typeof obj === "object" && obj !== null) {
        target = {}
        if("type" in obj) {
            switch(obj.type) {
                case "atblock":
                    const KEY = formatKey(obj.value.replace('@', ''))
                    BaseJsonCopy.formData[KEY] = ``
                    target = {
                        type: "view",
                        style: {
                            display: "inline-block",
                            whiteSpace: "pre"
                        },
                        children: [
                            {
                                type: "textField",
                                dataKey: "formData.data." + KEY,
                                value: "formData.data." + KEY,
                                placeholder: KEY,
                                style: {
                                    display: `=..formData.atrribute.is_edit`,
                                    width: "200px",
                                    height: "40px",
                                    boxSizing: "border-box",
                                    textIndent: "0.8em",
                                    color: "#333333",
                                    outline: "none",
                                    border: "1px solid #DEDEDE",
                                    borderWidth: "thin",
                                    borderRadius: "4px",
                                    lineHeight: "40px"
                                }
                            },
                            {
                                type: "view",
                                text: "=..formData.data." + KEY,
                                style: {
                                    display: "=..formData.atrribute.is_read",
                                    height: "40px",
                                    lineHeight: "40px"
                                } 
                            }
                        ]
                    }
                    break;
                case "sharpblock": 
                    if(/#[\w*]+:[^:]+:[^:]+/.test(obj.value)) {
                        const text = obj.value.replace(/#/, '')
                        const splitArr = text.split(/:/g)
                        let required = false
                        let title = splitArr[1]
                        if(splitArr[0].endsWith("*")) {
                            required = true
                        }
                        BaseJsonCopy.formData[formatKey(title)] = ``
                        target = sharpYaml({
                            type: splitArr[0].replace("*", '') as SharpType,
                            config: {
                                title: title,
                                placeholder: splitArr[2]
                            },
                            isRequired: required
                        })
                    } else {
                        const text = obj.value.replace(/#/, '')
                        BaseJsonCopy.formData[formatKey(text)] = ''
                        target = sharpYaml({
                            type: text,
                            config: {}
                        })
                    }
                    break;
                default:
                    target = {
                        type: typeConfig.get(obj.type),
                        style: {
                            with: "calc(100%)",
                            marginTop: "15px"
                        }
                    }
                    if(typeStyle.has(obj.type)) {
                        target.style = Object.assign(target.style, typeStyle.get(obj.type))
                    }
                    Object.keys(obj).forEach(key => {
                        if(styleConfig.has(key)) {
                            target.style = Object.assign(target.style, JSON.parse(styleConfig.get(key)?.replace(/__REPLACE__/g, obj[key]) as string))
                        }
                    })
                    if(!SkipType.has(obj.type)) {
                        target.children = populateBlock(obj.children, BaseJsonCopy)
                    }
                    break;
            }
        } else {
            target = {
                type: "label",
                text: obj.text,
                style: {
                    height: "40px",
                    lineHeight: "40px",
                    display: "inline-block",
                    whiteSpace: "pre"
                }
            }
            Object.keys(obj).forEach(key => {
                if(key !== "text") {
                    if(typeof obj[key] === "boolean") {
                        target["style"] = Object.assign(target["style"], JSON.parse(styleConfig.get(key) as string))
                    } else if(colorReg.test(obj[key])) {
                        // @ts-ignore
                        target["style"][styleConfig.get(key)] = rgb2hex(obj[key])
                    }
                }
            })
            if(Object.keys(target["style"]).length === 0) delete target["style"]
        }
    }
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