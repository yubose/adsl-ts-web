import { IDomEditor } from "@wangeditor/editor";
// import atMap from "../formDataMap/atMap";
import { deepCopy } from "../utils/deepCopy";
import BaseJson from "./BaseJson";
// import * as yaml from "yaml"
import sharpYaml from "./sharpYaml";
import { SharpType } from "../utils/config";
// import DataSource from "../dataSource/data";
import formatKey from "../utils/format";
import { facilityInfoYaml } from "../dataSource/infoYaml";
import getTitleList from "../utils/getTitleList";

const getYaml = (editor: IDomEditor) => {
    try {
        let BaseJsonCopy = deepCopy(BaseJson)
        const json = editor.children
        let jsonFix = fixJson(json, BaseJsonCopy)

        BaseJsonCopy.components = jsonFix

        const requiredSet = getTitleList(editor, true)
        let required = new Array()

        requiredSet.forEach((item: string) => {
            required.push({
                key: formatKey(item, true),
                title: item
            })
        })

        return {
            data: BaseJsonCopy.formData,
            components: BaseJsonCopy.components,
            required: required
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
    ["paragraph", "richtext"],
    ["header1", "view"],
    ["header2", "view"],
    ["header3", "view"],
    ["header4", "view"],
    ["header5", "view"],
    ["divider", "divider"]
    // ["paragraph", "label"]
])

const typeStyle = new Map<string, Object>([
    ["header1", {
        fontSize: "..formData.atrribute.noodl_font.h1",
        marginBlockStart: "0.67em",
        // marginBlockEnd: "0.67em",
        marginInlineStart: "0px",
        // marginInlineEnd: "0px",
        fontWeight: 700
    }],
    ["header2", {
        fontSize: "..formData.atrribute.noodl_font.h2",
        marginBlockStart: "0.83em",
        // marginBlockEnd: "0.83em",
        marginInlineStart: "0px",
        // marginInlineEnd: "0px",
        fontWeight: 700
    }],
    ["header3", {
        fontSize: "..formData.atrribute.noodl_font.h3",
        marginBlockStart: "1em",
        // marginBlockEnd: "1em",
        marginInlineStart: "0px",
        // marginInlineEnd: "0px",
        fontWeight: 700
    }],
    ["header4", {
        fontSize: "..formData.atrribute.noodl_font.h4",
        marginBlockStart: "1.33em",
        // marginBlockEnd: "1.33em",
        marginInlineStart: "0px",
        // marginInlineEnd: "0px",
        fontWeight: 700
    }],
    ["header5", {
        fontSize: "..formData.atrribute.noodl_font.h5",
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
    // ["indent", '{"marginLeft": "__REPLACE__"}'],
    ["textAlign", '{"display": "flex", "justifyContent": "__REPLACE__", "textAlign": "__REPLACE__"}']
])

const inheritStyleList = new Set(["fontSize", "fontWeight"])

const SkipType = new Set(["divider"])

const colorReg = /rgb\((.)+\)/
// const RefReg = /(@\[[\w '\(\)]+\]|#\[\w+:[^:]+:[^:]+\]|#\[\w+\])/g
// const Reg = /@\[[\w '\(\)]+\]|#\[\w+:[^:]+:[^:]+\]|#\[\w+\]/
// const AtSplitReg = /[@\[\]]/g
// const SharpSplitReg = /[@#\[\]]/g
// const AtReg = /@\[[\w '\(\)]+\]/
// const SharpTypeReg = /#\[\w+:[^:]+:[^:]+\]/
// const SharpReg = /#\[\w+\]/
// const AtTemplateReg = /@\[[^:]+:\w+\]/


const fixJson = (json, BaseJsonCopy) => {
    // return populate(json, BaseJsonCopy).target
    return populateBlock(json, BaseJsonCopy)
}

// const populate = (obj, BaseJsonCopy) => {
//     let target
//     let isConcat = false
//     if(obj instanceof Array) {
//         target = []
//         obj.forEach(item => {
//             const res = populate(item, BaseJsonCopy)
//             if(res.isConcat) {
//                 target = [...target, ...res.target]
//             } else {
//                 target.push(res.target)
//             }
//         })
//     } else if(typeof obj === 'object' && obj !== null) {
//         target = {}
//         if("type" in obj) {
//             target.type = typeConfig.get(obj.type)
//             target.style = {
//                 width: "calc(100%)",
//                 marginTop: "15px",
//             }
//             if(typeStyle.has(obj.type)) {
//                 target.style = Object.assign(target.style, typeStyle.get(obj.type))
//             }
//             Object.keys(obj).forEach(key => {
//                 if(styleConfig.has(key)) {
//                     target.style = Object.assign(target.style, JSON.parse(styleConfig.get(key)?.replace(/__REPLACE__/g, obj[key]) as string))
//                 }
//             })
//             if(!SkipType.has(obj.type)) {
//                 target.children = populate(obj.children, BaseJsonCopy).target
//             }
//         } else {
//             if(Reg.test(obj.text)) {
//                 isConcat = true
//                 target = []
//                 const arr = obj.text.split(RefReg)
//                 arr.forEach(item => {
//                     if(item !== '') {
//                         let txt = { text: item }
//                         target.push(oprate(Object.assign({}, obj, txt), BaseJsonCopy))
//                     }
//                 })
//             } else if(obj.text !== '') {
//                 target = oprate(obj, BaseJsonCopy)
//             }
//         }
//     }
//     return {
//         target: target,
//         isConcat: isConcat
//     }
// }

// const oprate = (obj, BaseJsonCopy) => {
//     let target = {}
//     if(AtReg.test(obj.text)){
//         const KEY = formatKey(obj.text.replace(AtSplitReg, ''))
//         BaseJsonCopy.formData[KEY] = ``
//         target = {
//             type: "view",
//             children: [
//                 {
//                     type: "textField",
//                     dataKey: "formData.data." + KEY,
//                     value: "formData.data." + KEY,
//                     placeholder: KEY,
//                     style: {
//                         display: `..formData.atrribute.is_edit`,
//                         width: "200px",
//                         height: "40px",
//                         boxSizing: "border-box",
//                         textIndent: "0.8em",
//                         color: "#333333",
//                         outline: "none",
//                         border: "1px solid #DEDEDE",
//                         // borderColor: "#DEDEDE",
//                         // borderStyle: "solid",
//                         borderWidth: "thin",
//                         borderRadius: "4px",
//                         lineHeight: "40px"
//                     }
//                 },
//                 {
//                     type: "view",
//                     text: "=..formData.data." + KEY,
//                     style: {
//                         display: "..formData.atrribute.is_read",
//                         height: "40px",
//                         lineHeight: "40px"
//                     } 
//                 }
//             ]
//         }
//     }
//     else if(SharpTypeReg.test(obj.text)) {
//         const text = obj.text.replace(SharpSplitReg, '')
//         const splitArr = text.split(/:/g)
//         let required = false
//         let title = splitArr[1]
//         if(/@\(\*\)/.test(obj.text)) {
//             required = true
//             title = splitArr[1].replace(/\(\*\)/, '')
//         }
//         BaseJsonCopy.formData[formatKey(title)] = ``
//         target = sharpYaml({
//             type: splitArr[0] as SharpType,
//             config: {
//                 title: title,
//                 placeholder: splitArr[2]
//             },
//             isRequired: required
//         })
//         // target = {
//         //     type: "view",
//         //     style: {
//         //         width: "calc(92%)",
//         //         margin: "auto"
//         //     },
//         //     children: [
//         //         {
//         //             type: "view",
//         //             text: text
//         //         },
//         //         {
//         //             type: "textView",
//         //             dataKey: "formData." + text,
//         //             style: {
//         //                 display: `=..formData._isProvider`,
//         //                 minHeight: "80px",
//         //                 width: "calc(100%)"
//         //             }
//         //         },
//         //         {
//         //             type: "view",
//         //             text: "..formData." + text,
//         //             style: {
//         //                 display: "=..formData._isPatient",
//         //                 wordWrap: "break-word"
//         //             } 
//         //         }
//         //     ]
//         // }
//         return target
//     }
//     else if(SharpReg.test(obj.text)) {
//         const text = obj.text.replace(SharpSplitReg, '')
//         switch(text) {
//             case "FacilityInfo": 
//                 return facilityInfoYaml
//             case "PatientInfo":
//                 // return patientInfoYaml
//             case "ProviderInfo":
//             default: 
//                 return {}
//         }
//     }
//     else {
//         // target["type"] = "label"
//         // target["text"] = obj.text
//         target = {
//             type: "label",
//             text: obj.text,
//             style: {
//                 height: "40px",
//                 lineHeight: "40px"
//             }
//         }
//     }
//     if(!("style" in target)) {
//         target["style"] = {
//             display: "inline-block",
//             // whiteSpace: "pre"
//         }
//     } else {
//         target.style = Object.assign(target.style as {}, {
//             display: "inline-block",
//             // whiteSpace: "pre"
//         })
//     }
    
//     Object.keys(obj).forEach(key => {
//         if(key !== "text") {
//             if(typeof obj[key] === "boolean") {
//                 target["style"] = Object.assign(target["style"], JSON.parse(styleConfig.get(key) as string))
//             } else if(colorReg.test(obj[key])) {
//                 target["style"][styleConfig.get(key)] = rgb2hex(obj[key])
//             }
//         }
//     })
//     if(Object.keys(target["style"]).length === 0) delete target["style"]
//     return target
// }

const populateBlock = (obj, BaseJsonCopy, style = {}, isText = false) => {
    let target
    if(obj instanceof Array) {
        target = []
        obj.forEach(item => {
            const res = populateBlock(item, BaseJsonCopy, style, isText)
            if(res instanceof Array) {
                target = target.concat(res)
            } else {
                target.push(res)
            }
        })
    } else if(typeof obj === "object" && obj !== null) {
        target = {}
        if("type" in obj) {
            switch(obj.type) {
                case "atblock":
                    const KEY = formatKey(obj.value.replace('@', ''))
                    BaseJsonCopy.formData[KEY] = ``
                    if(KEY === "DateOrDateOfService") {
                        target = [
                            {
                                text: "--",
                                dataKey: "formData.data." + KEY,
                                lineHeight: "..formData.atrribute.noodl_font.lineHeight"
                            }
                        ]
                    } else {
                        target = [
                            {
                                textField: "",
                                dataKey: "formData.data." + KEY,
                                placeholder: "Enter here",
                                display: `..formData.atrribute.is_edit`,
                                width: "..formData.atrribute.noodl_font.atBlockWidth",
                                // height: "40px",
                                boxSizing: "border-box",
                                textIndent: "0.8em",
                                color: "#333333",
                                outline: "none",
                                border: "1px solid #DEDEDE",
                                borderWidth: "thin",
                                borderRadius: "4px",
                                // lineHeight: "40px"
                                lineHeight: "..formData.atrribute.noodl_font.lineHeight"
                            },
                            {
                                text: "--",
                                dataKey: "formData.data." + KEY,
                                display: "..formData.atrribute.is_read",
                                lineHeight: "..formData.atrribute.noodl_font.lineHeight"
                            }
                        ]
                    }
                    // if(KEY === "DateOrDateOfService") {
                    //     target = {
                    //         type: "view",
                    //         style: {
                    //             flexGrow:0,
                    //             flexShrink:0
                    //         },
                    //         children: [
                    //             {
                    //                 type: "label",
                    //                 dataKey: "formData.data." + KEY,
                    //                 style: {
                    //                     width: "..formData.atrribute.noodl_font.atBlockWidth",
                    //                     wordWrap: "break-word"
                    //                     // display: "..formData.atrribute.is_read",
                    //                     // height: "40px",
                    //                     // lineHeight: "40px"
                    //                 } 
                    //             }
                    //         ]
                    //     }
                    // } else {
                    //     target = {
                    //         type: "view",
                    //         style: {
                    //             flexGrow:0,
                    //             flexShrink:0
                    //         },
                    //         children: [
                    //             {
                    //                 type: "textField",
                    //                 dataKey: "formData.data." + KEY,
                    //                 value: "formData.data." + KEY,
                    //                 placeholder: "Enter here",
                    //                 contentType: "strictLength",
                    //                 strictLength: {
                    //                     min: 0,
                    //                     max: 100
                    //                 },
                    //                 style: {
                    //                     display: `..formData.atrribute.is_edit`,
                    //                     width: "..formData.atrribute.noodl_font.atBlockWidth",
                    //                     // height: "40px",
                    //                     boxSizing: "border-box",
                    //                     textIndent: "0.8em",
                    //                     color: "#333333",
                    //                     outline: "none",
                    //                     border: "1px solid #DEDEDE",
                    //                     borderWidth: "thin",
                    //                     borderRadius: "4px",
                    //                     // lineHeight: "40px"
                    //                     lineHeight: "..formData.atrribute.noodl_font.lineHeight"
                    //                 }
                    //             },
                    //             {
                    //                 type: "label",
                    //                 dataKey: "formData.data." + KEY,
                    //                 text: "--",
                    //                 style: {
                    //                     display: "..formData.atrribute.is_read",
                    //                     width: "..formData.atrribute.noodl_font.atBlockWidth",
                    //                     wordWrap: "break-word"
                    //                     // height: "40px",
                    //                     // lineHeight: "40px"
                    //                 } 
                    //             }
                    //         ]
                    //     }
                    // }
                    break;
                case "sharpblock": 
                    if(/#[\w*]+:[^:]+:[^:]+/.test(obj.value)) {
                        const text = obj.value.replace(/#/, '')
                        const splitArr = text.split(/:/g)
                        let required = false
                        let title = splitArr[1]
                        if(splitArr[0].endsWith("*")) {
                            required = true
                            // BaseJson.required.push({
                            //     key: formatKey(title, true),
                            //     title: title
                            // })
                        }
                        BaseJsonCopy.formData[formatKey(title, true)] = ``
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
                        // BaseJsonCopy.formData[formatKey(text)] = ''
                        // BaseJsonCopy.fromData["signatureTime"] = ''
                        BaseJsonCopy.formData["signatureId"] = ''
                        target = sharpYaml({
                            type: text,
                            config: {}
                        })
                    }
                    break;
                case "paragraph":
                    target = {
                        type: typeConfig.get(obj.type),
                        style: {
                            width: "calc(100%)",
                            marginTop: "0.005",
                            paddingTop: "0.005",
                            // height: "..formData.atrribute.noodl_font.lineHeight",
                            // display: "flex",
                            // alignItems: "..formData.atrribute.alignItems",
                            fontSize: "..formData.atrribute.text",
                            // flexWrap: "wrap"
                        }
                    }
                    Object.keys(obj).forEach(key => {
                        if(styleConfig.has(key)) {
                            target.style = Object.assign(target.style, JSON.parse(styleConfig.get(key)?.replace(/__REPLACE__/g, obj[key]) as string))
                        }
                    })
                    target.style.minHeight = "..formData.atrribute.noodl_font.lineHeight"
                    target.textBoard = populateBlock(obj.children, BaseJsonCopy, {}, true)
                    break
                default: 
                    let paddingTop = '0.005'
                    if(SkipType.has(obj.type)) paddingTop = "0"
                    target = {
                        type: typeConfig.get(obj.type),
                        style: {
                            width: "calc(100%)",
                            marginTop: "0.005",
                            paddingTop: paddingTop,
                            // height: "..formData.atrribute.noodl_font.lineHeight",
                            display: "flex",
                            alignItems: "..formData.atrribute.alignItems",
                            fontSize: "..formData.atrribute.text",
                            flexWrap: "wrap"
                        }
                    }
                    let inheritStyle = {}
                    if(typeStyle.has(obj.type)) {
                        const styleText = typeStyle.get(obj.type) as Object
                        target.style = Object.assign(target.style, styleText)
                        Object.keys(styleText).forEach(key => {
                            if(inheritStyleList.has(key)) {
                                inheritStyle[key] = styleText[key]
                            }
                        })
                    }
                    Object.keys(obj).forEach(key => {
                        if(styleConfig.has(key)) {
                            target.style = Object.assign(target.style, JSON.parse(styleConfig.get(key)?.replace(/__REPLACE__/g, obj[key]) as string))
                        }
                    })
                    if(!SkipType.has(obj.type)) {
                        target.style.minHeight = "..formData.atrribute.noodl_font.lineHeight"
                        target.children = populateBlock(obj.children, BaseJsonCopy, inheritStyle)
                    }
                    break;
            }
        } else {
            if(obj.text === '') return {}
            if(isText) {
                target = {
                    text: obj.text,
                    lineHeight: "..formData.atrribute.noodl_font.lineHeight" 
                }
                Object.keys(obj).forEach(key => {
                    if(key !== "text") {
                        if(typeof obj[key] === "boolean") {
                            target = Object.assign(target, JSON.parse(styleConfig.get(key) as string))
                        } else if(colorReg.test(obj[key])) {
                            // @ts-ignore
                            target[styleConfig.get(key)] = rgb2hex(obj[key])
                        }
                    }
                })
            } else {
                target = {
                    type: "label",
                    text: obj.text.replace(/ /g, "&nbsp;"),
                    style: {
                        // height: "40px",
                        // lineHeight: "40px",
                        flexGrow:0,
                        flexShrink:0,
                        // whiteSpace: "pre",
                        // marginTop: "0.005",
                        // fontSize: "..formData.atrribute.noodl_font.text"
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
                if(Object.keys(style).length !== 0) {
                    target.style = Object.assign(target.style, style)
                }
                if(Object.keys(target["style"]).length === 0) delete target["style"]
            }
            
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