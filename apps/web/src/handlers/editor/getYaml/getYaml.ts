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
import { editorBlockSet, getUuid } from "../utils/utils";
import { choiceSharpReg, textSharpReg, textSharpSplitRegG } from "../utils/textSharp";
import { getDateAndTime } from "../utils/events";
import getImageList from "../utils/getImageList";


const getYaml = (editor: IDomEditor) => {
    try {
        let BaseJsonCopy = deepCopy(BaseJson)

        const json = editor.children
        let jsonFix = fixJson(json, BaseJsonCopy)

        BaseJsonCopy.components = jsonFix

        // BaseJsonCopy.formData = Object.assign(BaseJsonCopy.formData, uuids.formData)

        const required = getTitleList(editor)
        const events = {
            DateAndTime: getDateAndTime(editor)
        }

        const imageObj = getImageList(editor)
        // let required = new Array()

        // requiredSet.forEach((item: string) => {
        //     required.push({
        //         // key: getUuid(),
        //         title: item
        //     })
        // })

        return {
            data: BaseJsonCopy.formData,
            components: BaseJsonCopy.components,
            images: imageObj.imageList,
            imageOptions: imageObj.imageOptions,
            imgCanvas: BaseJsonCopy.imgCanvas,
            required: required,
            events
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
    ["divider", "divider"],
    ["table", "view"],
    // ["table-row", "view"],
    // ["table-cell", "view"],
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
    ["textAlign", '{"display": "flex", "justifyContent": "__REPLACE__", "textAlign": {"x": "__REPLACE__"}}']
])

const inheritStyleList = new Set(["fontSize", "fontWeight"])

const SkipType = new Set(["divider"])

const colorReg = /rgb\((.)+\)/
// const colorReg = /rgb\((2[0-4][0-9]|25[0-5]|1?[0-9]{0,2}), (2[0-4][0-9]|25[0-5]|1?[0-9]{0,2}), (2[0-4][0-9]|25[0-5]|1?[0-9]{0,2})\)/
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
    return populateBlock({obj:json, BaseJsonCopy})
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
//                 width: "..formData.atrribute.noodl_font.fullWidth",
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
//         //                 width: "..formData.atrribute.noodl_font.fullWidth"
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

const populateBlock = ({
    obj, 
    BaseJsonCopy, 
    style = {}
}: {
    obj: any
    BaseJsonCopy: any
    style?: any
}) => {
    let target
    if(obj instanceof Array) {
        target = []
        obj.forEach(item => {
            target.push(populateBlock({
                obj: item, 
                BaseJsonCopy, 
                style
            }))
        })
    } else if(typeof obj === "object" && obj !== null) {
        target = {}
        if("type" in obj) {
            switch(obj.type) {
                case "atblock":
                    const KEY = formatKey(obj.value.replace('@', ''))
                    BaseJsonCopy.formData[KEY] = ``
                    // const textAlign = obj
                    if(KEY === "DateOrDateOfService") {
                        target = {
                            type: "view",
                            children: [
                                {
                                    type: "label",
                                    text: "--",
                                    dataKey: "formData.data." + KEY,
                                    style: {
                                        lineHeight: "..formData.atrribute.noodl_font.lineHeight"
                                    }
                                }
                            ]
                        }
                    } else if(KEY === "InputBoxShort") {
                        delete BaseJsonCopy.formData[KEY]
                        const id = getUuid()
                        BaseJsonCopy.formData[id] = ``
                        target = {
                            type: "view",
                            children: [
                                {
                                    type: "textField",
                                    dataKey: "formData.data." + id,
                                    placeholder: "Enter here",
                                    style: {
                                        display: `..formData.atrribute.is_edit`,
                                        width: "..formData.atrribute.noodl_font.atBlockWidth",
                                        boxSizing: "border-box",
                                        textIndent: "0.8em",
                                        color: "#333333",
                                        outline: "none",
                                        border: "1px solid #DEDEDE",
                                        borderWidth: "thin",
                                        borderRadius: "4px",
                                        lineHeight: "..formData.atrribute.noodl_font.lineHeight"
                                    }
                                },
                                {
                                    type: "label",
                                    text: "--",
                                    dataKey: "formData.data." + id,
                                    style: Object.assign(style, {
                                        display: "..formData.atrribute.is_read",
                                        lineHeight: "..formData.atrribute.noodl_font.lineHeight",
                                        wordWrap: "break-word",
                                        wordBreak: "break-word",
                                        whiteSpace: "pre-wrap"
                                    })
                                }
                            ]
                        }
                    } else {
                        target = {
                            type: "view",
                            children: [
                                {
                                    type: "textField",
                                    dataKey: "formData.data." + KEY,
                                    placeholder: "Enter here",
                                    style: {
                                        display: `..formData.atrribute.is_edit`,
                                        width: "..formData.atrribute.noodl_font.atBlockWidth",
                                        boxSizing: "border-box",
                                        textIndent: "0.8em",
                                        color: "#333333",
                                        outline: "none",
                                        border: "1px solid #DEDEDE",
                                        borderWidth: "thin",
                                        borderRadius: "4px",
                                        lineHeight: "..formData.atrribute.noodl_font.lineHeight"
                                    }
                                },
                                {
                                    type: "label",
                                    text: "--",
                                    dataKey: "formData.data." + KEY,
                                    style: Object.assign(style, {
                                        display: "..formData.atrribute.is_read",
                                        lineHeight: "..formData.atrribute.noodl_font.lineHeight",
                                        wordWrap: "break-word",
                                        wordBreak: "break-word",
                                        whiteSpace: "pre-wrap"
                                    })
                                }
                            ]
                        }
                    }
                    break;
                case "sharpblock": 
                    if(textSharpReg.test(obj.value)) {
                        const text = obj.value.replace(/#/, '')
                        const splitArr = text.split(textSharpSplitRegG)
                        let required = false
                        let title = splitArr[1]
                        if(splitArr[0].endsWith("*")) {
                            required = true
                        }
                        // BaseJsonCopy.formData[formatKey(title, true)] = ``
                        BaseJsonCopy.formData[obj.key] = ``
                        target = sharpYaml({
                            type: splitArr[0].replace("*", '') as SharpType,
                            config: {
                                title: title,
                                placeholder: splitArr[2],
                                key: obj.key
                            },
                            isRequired: required
                        })
                    } else if(choiceSharpReg.test(obj.value)) {
                        const text = obj.value.replace(/#/, '')
                        const list = obj.choiceStr
                        const splitArr = text.split(textSharpSplitRegG)
                        let required = false
                        // let currentTime = false
                        let title = splitArr[1]
                        if(splitArr[0].endsWith("*")) {
                            required = true
                        }
                        // if(splitArr[0].includes("$")) {
                        //     currentTime = true
                        // }
                        BaseJsonCopy.formData[obj.key] = {}
                        target = sharpYaml({
                            type: splitArr[0].replace("*", '').replace('$', '') as SharpType,
                            config: {
                                title: title,
                                key: obj.key,
                                list
                            },
                            isRequired: required,
                            // isCurrentTime: currentTime
                        }, BaseJsonCopy)
                    } else if(obj.value === "#Signature") {
                        const text = obj.value.replace(/#/, '')
                        BaseJsonCopy.formData["signatureId"] = ''
                        target = sharpYaml({
                            type: text,
                            config: {}
                        })
                    } else if(obj.value === "#Provider Signature") {
                        const text = obj.value.replace(/#/, '')
                        BaseJsonCopy.formData["signatureId"] = ''
                        target = sharpYaml({
                            type: text,
                            config: {}
                        })
                    } else if(obj.value === "#Patient/Guardian Signature") {
                        const text = obj.value.replace(/#/, '')
                        BaseJsonCopy.formData["patdSignatureId"] = ''
                        BaseJsonCopy.formData["needPatdSignature"] = true
                        target = sharpYaml({
                            type: text,
                            config: {}
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
                case "paragraph":
                    target = {
                        type: typeConfig.get(obj.type),
                        style: {
                            width: "..formData.atrribute.noodl_font.fullWidth",
                            marginTop: "0.01",
                            // paddingTop: "0.005",
                            fontSize: "..formData.atrribute.noodl_font.text",
                            wordWrap: "break-word",
                            wordBreak: "break-word",
                            whiteSpace: "pre-wrap",
                            minHeight: "..formData.atrribute.noodl_font.lineHeight",
                            // textAlign: {
                            //     y: "center"
                            // },
                            display: "flex",
                            // alignItems: "..formData.atrribute.alignItems",
                            alignItems: "center",
                            flexWrap: "wrap"
                        }
                    }
                    let inherit = {}
                    Object.keys(obj).forEach(key => {
                        if(styleConfig.has(key)) {
                            target.style = Object.assign(target.style, JSON.parse(styleConfig.get(key)?.replace(/__REPLACE__/g, obj[key]) as string))
                            inherit = Object.assign(inherit, JSON.parse(styleConfig.get(key)?.replace(/__REPLACE__/g, obj[key]) as string))
                        }
                    })
                    if(obj.children.length === 1 && obj.children[0].text === '') {
                        delete target.style.minHeight
                        target.style.height = "..formData.atrribute.noodl_font.blankHeight"
                    }
                    target.children = populateBlock({
                        obj: obj.children, 
                        BaseJsonCopy, 
                        style: inherit
                    })
                    break
                case "table":
                    const width = obj.width === "auto" ? obj.width : "..formData.atrribute.noodl_font.fullWidth"
                    target = {
                        type: typeConfig.get(obj.type),
                        style: {
                            width: width,
                            marginTop: "0.005",
                            paddingTop: "0.005",
                            fontSize: "..formData.atrribute.noodl_font.text",
                            display: "flex",
                            flexDirection: "column"
                        }
                    }
                    const allWidth = width === "auto" ? 0 : 100
                    const widthList = new Array<number>()
                    const widthArray = new Array<string>()
                    const flexShrinks = new Array<number>()
                    const row = obj.children[0].children
                    row.forEach((it) => {
                        if(allWidth === 0) {
                            widthList.push(it?.width && it?.width !== "auto" ? parseFloat(it.width) : 30)
                        } else {
                            widthList.push(it?.width && it?.width !== "auto" ? parseFloat(it.width) : Math.floor(10000/row.length)/100)
                        }
                    })
                    if(allWidth === 0) {
                        let W = 0
                        widthList.forEach(it => {
                            W += it
                        })
                        widthList.forEach((it, i) => {
                            if(it === 30) {
                                widthArray[i] = `..formData.atrribute.noodl_font.tableMinWidth`
                                flexShrinks[i] = 0
                            } else {
                                widthArray[i] = `calc(${100*Math.floor(100*it/W)/100}%)`
                                flexShrinks[i] = 1
                            }
                        })
                    } 
                    else {
                        let W = 0
                        let R = 1
                        widthList.forEach(it => {
                            if(it === Math.floor(10000/row.length)/100) {
                                R -= it/100
                            } else {
                                W += it
                            }   
                        })
                        widthList.forEach((it, i) => {
                            if(it === Math.floor(10000/row.length)/100) {
                                widthArray[i] = `calc(${it}%)`
                                flexShrinks[i] = 0
                            } else {
                                widthArray[i] = `calc(${Math.floor(10000*R*it/W)/100}%)`
                                flexShrinks[i] = 1
                            }
                        })
                    }
                    // console.log(widthList)
                    target.children = new Array()
                    obj.children.forEach((item, index) => {
                        const child = {
                            type: "view",
                            style: {
                                display: "flex",
                                width: width
                            },
                            table: "td",
                            children: new Array()
                        }
                        item.children.forEach((it, idx) => {
                            let textAlign = it?.isHeader ? {x: 'center', y:"center"} : {x: 'start', y:"center"}
                            let justifyContent = it?.isHeader ? 'center' : 'start'
                            textAlign = it?.textAlign ? {x: it.textAlign, y:"center"} : textAlign
                            justifyContent = it?.textAlign ? it.textAlign : justifyContent
                            let backgroundColor = it?.isHeader ? "#f5f2f0" : "#ffffff"
                            let fontWeight = it?.isHeader ? "600" : "normal"
                            const c = {
                                type: "view",
                                style: {
                                    width: widthArray[idx],
                                    minWidth: '..formData.atrribute.noodl_font.tableMinWidth',
                                    // minHeight: "..formData.atrribute.noodl_font.lineHeight",
                                    border: "1px solid #cccccc",
                                    marginLeft: "-1px",
                                    marginTop: "-1px",
                                    backgroundColor,
                                    display: "flex",
                                    justifyContent,
                                    alignItems: "center",
                                    textAlign,
                                    flexShrink: flexShrinks[idx],
                                    fontWeight,
                                    padding: "0.005",
                                    boxSizing: "border-box"
                                },
                                children: new Array()
                            }
                            if(it.children.length === 1) {
                                if(it.children[0].text === "") {
                                    const key = getUuid()
                                    BaseJsonCopy.formData[key] = ``
                                    c.children = c.children.concat([
                                        {
                                            type: "textField",
                                            dataKey: "formData.data." + key,
                                            style: {
                                                display: `..formData.atrribute.is_edit`,
                                                minWidth: '..formData.atrribute.noodl_font.tableMinWidth',
                                                width: `calc(100%)`,
                                                minHeight: "..formData.atrribute.noodl_font.lineHeight",
                                                height: "calc(100%)",
                                                fontSize: "..formData.atrribute.noodl_font.text",
                                                border: "none",
                                                textAlign,
                                                fontWeight,
                                                backgroundColor,
                                            }
                                        },
                                        {
                                            type: "label",
                                            dataKey: "formData.data." + key,
                                            // text: "--",
                                            style: {
                                                display: `..formData.atrribute.is_read`,
                                                minWidth: '..formData.atrribute.noodl_font.tableMinWidth',
                                                width: `calc(100%)`,
                                                minHeight: "..formData.atrribute.noodl_font.lineHeight",
                                                textAlign,
                                                fontSize: "..formData.atrribute.noodl_font.text",
                                                wordBreak: "break-word",
                                                fontWeight,
                                                backgroundColor,
                                            }
                                        }
                                    ])
                                } else {
                                    c.children.push({
                                        type: "label",
                                        text: `${it.children[0].text}`,
                                        style: {
                                            width: `calc(100%)`,
                                            minWidth: '..formData.atrribute.noodl_font.tableMinWidth',
                                            minHeight: "..formData.atrribute.noodl_font.lineHeight",
                                            textAlign,
                                            fontSize: "..formData.atrribute.noodl_font.text",
                                            wordBreak: "break-word",
                                            fontWeight,
                                            backgroundColor,
                                        }
                                    })
                                }
                            }
                            child.children.push(c)
                        })
                        target.children.push(child)
                    })
                    break
                case "image": 
                    let imageStyle = {}
                    if(obj.style) {
                        imageStyle = {
                            width: obj.style.width,
                            height: "auto"
                        }
                    }
                    BaseJsonCopy.formData[obj.alt] = ``
                    if(obj.href !== '') {
                        // target = {
                        //     type: "view",
                        //     style: Object.assign({...imageStyle}, {
                        //         maxWidth: `..formData.atrribute.noodl_font.imageMaxWidth`
                        //     }),
                        //     children: [
                        //         {
                        //             type: "image",
                        //             "path=func": "..customEvent.prepareDocToPath",
                        //             dataKey: 'formData.data.' + obj.alt,
                        //             viewTag: obj.alt,
                        //             style: Object.assign({...imageStyle}, {
                        //                 maxWidth: `100%`,
                        //                 display: "=..formData.atrribute.is_edit"
                        //             }),
                        //             onClick: [
                        //                 {
                        //                     emit: {
                        //                         actions: [
                        //                             {
                        //                                 "=.builtIn.object.set": {
                        //                                     dataIn: {
                        //                                         object: "=..formData.imgCanvas",
                        //                                         key: "option",
                        //                                         value: "=..formData.editableImage." + obj.alt
                        //                                     }
                        //                                 }
                        //                             }
                        //                         ]
                        //                     }
                        //                 },
                        //                 {
                        //                     actionType: "builtIn",
                        //                     funcName: "redraw",
                        //                     viewTag: "imgCanvasTag"
                        //                 },
                        //                 {
                        //                     actionType: "popUp",
                        //                     popUpView: "imgCanvasTag"
                        //                 },
                        //             ]
                        //         },
                        //         {
                        //             type: "image",
                        //             "path=func": "..customEvent.prepareDocToPath",
                        //             dataKey: 'formData.data.' + obj.alt,
                        //             style: Object.assign({...imageStyle}, {
                        //                 maxWidth: `100%`,
                        //                 display: "=..formData.atrribute.is_read"
                        //             }),
                        //             onClick: [
                        //                 {
                        //                     emit: {
                        //                         actions: [
                        //                             {
                        //                                 "=.builtIn.object.set": {
                        //                                     dataIn: {
                        //                                         object: "=..formData.imgCanvas",
                        //                                         key: "option",
                        //                                         value: "=..formData.editableImage." + obj.alt
                        //                                     }
                        //                                 }
                        //                             },
                        //                             {
                        //                                 "=.builtIn.object.set": {
                        //                                     dataIn: {
                        //                                         object: "=..formData.imgCanvas.option",
                        //                                         key: "isReadOnly",
                        //                                         value: true
                        //                                     }
                        //                                 }
                        //                             }
                        //                         ]
                        //                     }
                        //                 },
                        //                 {
                        //                     actionType: "builtIn",
                        //                     funcName: "redraw",
                        //                     viewTag: "imgCanvasTag"
                        //                 },
                        //                 {
                        //                     actionType: "popUp",
                        //                     popUpView: "imgCanvasTag"
                        //                 },
                        //             ]
                        //         }
                        //     ]
                        // }
                        target = {
                            type: "image",
                            "path=func": "..customEvent.prepareDocToPath",
                            dataKey: 'formData.data.' + obj.alt,
                            style: Object.assign(
                                {...imageStyle}, 
                                {maxWidth: `..formData.atrribute.noodl_font.imageMaxWidth`}
                            ),
                            onClick: [
                                {
                                    emit: {
                                        actions: [
                                            {
                                                "=.builtIn.object.set": {
                                                    dataIn: {
                                                        object: "=..formData.imgCanvas",
                                                        key: "option",
                                                        value: "=..formData.editableImage." + obj.alt
                                                    }
                                                }
                                            },
                                            {
                                                if: [
                                                    {
                                                        "=.builtIn.string.equal": {
                                                            dataIn: {
                                                                string1: "=..formData.atrribute.is_edit",
                                                                string2: "none"
                                                            }
                                                        }
                                                    },
                                                    {
                                                        "=.builtIn.object.set": {
                                                            dataIn: {
                                                                object: "=..formData.imgCanvas.option",
                                                                key: "isReadOnly",
                                                                value: true
                                                            }
                                                        }
                                                    },
                                                    "continue"
                                                ]
                                            }
                                        ]
                                    }
                                },
                                {
                                    actionType: "builtIn",
                                    funcName: "redraw",
                                    viewTag: "imgCanvasTag"
                                },
                                {
                                    actionType: "popUp",
                                    popUpView: "imgCanvasTag"
                                },
                            ]
                        }
                    } else {
                        target = {
                            type: "image",
                            "path=func": "..customEvent.prepareDocToPath",
                            dataKey: 'formData.data.' + obj.alt,
                            style: Object.assign(
                                {...imageStyle}, 
                                {maxWidth: `..formData.atrribute.noodl_font.imageMaxWidth`}
                            ),
                            onClick: [
                                {
                                    emit: {
                                        actions: [
                                            {
                                                "=.builtIn.object.set": {
                                                    dataIn: {
                                                        object: "=..formData.imgCanvas",
                                                        key: "option",
                                                        value: "=..formData.editableImage." + obj.alt
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    actionType: "builtIn",
                                    funcName: "redraw",
                                    viewTag: "imgCanvasTag"
                                },
                                {
                                    actionType: "popUp",
                                    popUpView: "imgCanvasTag"
                                },
                            ]
                        }
                    }
                    break
                default: 
                    // let paddingTop = '0.005'
                    // if(SkipType.has(obj.type)) paddingTop = "0"
                    target = {
                        type: typeConfig.get(obj.type),
                        style: {
                            width: "..formData.atrribute.noodl_font.fullWidth",
                            marginTop: "0.01",
                            // paddingTop: paddingTop,
                            // height: "..formData.atrribute.noodl_font.lineHeight",
                            display: "flex",
                            alignItems: "..formData.atrribute.alignItems",
                            fontSize: "..formData.atrribute.noodl_font.text",
                            flexWrap: "wrap",
                            wordWrap: "break-word",
                            wordBreak: "break-word",
                            whiteSpace: "pre-wrap",
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
                            inheritStyle = Object.assign(inheritStyle, JSON.parse(styleConfig.get(key)?.replace(/__REPLACE__/g, obj[key]) as string))
                        }
                    })
                    if(!SkipType.has(obj.type)) {
                        target.style.minHeight = "..formData.atrribute.noodl_font.lineHeight"
                        target.children = populateBlock({
                            obj: obj.children, 
                            BaseJsonCopy, 
                            style: inheritStyle
                        })
                    }
                    break;
            }
        } else {
            if(obj.text === '') return {}
            target = {
                type: "label",
                text: obj.text,
                style: {
                    // width: "..formData.atrribute.noodl_font.fullWidth",
                    fontSize: "..formData.atrribute.noodl_font.text",
                    wordWrap: "break-word",
                    wordBreak: "break-word",
                    whiteSpace: "pre-wrap",
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