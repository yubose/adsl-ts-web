import { SharpYamlOption } from "../utils/config"
import formatKey from "../utils/format"
import { textSharpSplitReg } from "../utils/textSharp"

const sharpYaml = (opts: SharpYamlOption, BaseJsonCopy: any = {}) => {
    let str = opts.isRequired ? `<span style="color:red"> *</span>` : ''
    let contentType = opts.isRequired ? 'strictLength' : null
    let viewTag = opts.isRequired ? `${formatKey(opts.config.title as string)}Tag` : null
    switch (opts.type) {
        case "TextField": 
            return {
                type: "view",
                style: {
                    width: "..formData.atrribute.noodl_font.fullWidth",
                    margin: "auto",
                },
                children: [
                    {
                        type: "label",
                        contentType: "html",
                        text: opts.config.title+str,
                        style: {
                            marginTop: "0.01",
                            // marginBottom: "15px",
                            color: "#333333",
                            fontSize: "..formData.atrribute.noodl_font.text",
                            fontWeight: 600
                        }
                    },
                    {
                        type: "textField",
                        // dataKey: "formData.data." + formatKey(opts.config.title as string, true),
                        dataKey: "formData.data." + opts.config.key,
                        // value: "formData.data." + formatKey(opts.config.title as string),
                        placeholder: opts.config.placeholder,
                        contentType,
                        viewTag,
                        style: {
                            display: `..formData.atrribute.is_edit`,
                            marginTop: "0.01",
                            // minHeight: "40px",
                            lineHeight: "..formData.atrribute.noodl_font.lineHeight",
                            width: "..formData.atrribute.noodl_font.fullWidth",
                            boxSizing: "border-box",
                            textIndent: "0.8em",
                            color: "#333333",
                            outline: "none",
                            border: "2px solid #DEDEDE",
                            borderWidth: "thin",
                            borderRadius: "4px",
                            padding: "2px"
                        }
                    },
                    {
                        type: "view",
                        style: {
                            marginTop: "0.01",
                            backgroundColor: "0xf4f4f4",
                            width: "..formData.atrribute.noodl_font.fullWidth",
                            boxSizing: "border-box",
                            height: "auto",
                        },
                        children: [
                            {
                                type: "label",
                                text: "No Content",
                                // text: "..formData.data." + formatKey(opts.config.title as string),
                                dataKey: "formData.data." + opts.config.key,
                                style: {
                                    display: "..formData.atrribute.is_read",
                                    width: "..formData.atrribute.noodl_font.fullWidth",
                                    height: "auto",
                                    verticalAlign: "middle",
                                    fontSize: "..formData.atrribute.noodl_font.h4",
                                    color: "0x666666",
                                    wordBreak: "break-word",
                                    wordWrap: "break-word",
                                    whiteSpace: "pre-wrap",
                                    paddingTop: "0.0046",
                                    paddingBottom: "0.0046",
                                    paddingLeft: "0.0046",
                                    boxSizing: "border-box"
                                } 
                            }
                        ]
                    }
                ]
            }
        case "TextView":
            return {
                type: "view",
                style: {
                    width: "..formData.atrribute.noodl_font.fullWidth",
                    margin: "auto"
                },
                children: [
                    {
                        type: "label",
                        contentType: "html",
                        text: opts.config.title+str,
                        style: {
                            marginTop: "0.01",
                            // marginBottom: "15px",
                            color: "#333333",
                            fontSize: "..formData.atrribute.noodl_font.text",
                            fontWeight: 600
                        }
                    },
                    {
                        type: "textView",
                        // dataKey: "formData.data." + formatKey(opts.config.title as string, true),
                        dataKey: "formData.data." + opts.config.key,
                        // value: "formData.data." + formatKey(opts.config.title as string),
                        placeholder: opts.config.placeholder,
                        contentType,
                        viewTag,
                        style: {
                            display: `..formData.atrribute.is_edit`,
                            marginTop: "0.01",
                            minHeight: "..formData.atrribute.noodl_font.doubleLineHeight",
                            width: "..formData.atrribute.noodl_font.fullWidth",
                            boxSizing: "border-box",
                            textIndent: "0.8em",
                            color: "#333333",
                            outline: "none",
                            border: "2px solid #DEDEDE",
                            borderWidth: "thin",
                            borderRadius: "4px",
                            lineHeight: "..formData.atrribute.noodl_font.lineHeight",
                            padding: "2px"
                        }
                    },
                    {
                        type: "view",
                        style: {
                            marginTop: "0.01",
                            backgroundColor: "0xf4f4f4",
                            width: "..formData.atrribute.noodl_font.fullWidth",
                            boxSizing: "border-box",
                            height: "auto",
                        },
                        children: [
                            {
                                type: "label",
                                // text: "..formData.data." + formatKey(opts.config.title as string),
                                text: "No Content",
                                dataKey: "formData.data." + opts.config.key,
                                style: {
                                    display: "..formData.atrribute.is_read",
                                    width: "..formData.atrribute.noodl_font.fullWidth",
                                    height: "auto",
                                    verticalAlign: "middle",
                                    fontSize: "..formData.atrribute.noodl_font.h4",
                                    color: "0x666666",
                                    wordBreak: "break-word",
                                    wordWrap: "break-word",
                                    whiteSpace: "pre-wrap",
                                    paddingTop: "0.0046",
                                    paddingBottom: "0.0046",
                                    paddingLeft: "0.0046",
                                    boxSizing: "border-box"
                                } 
                            }
                        ]
                    }
                ]
            }
        case "Signature":
            // return {
            //     type: "view",
            //     style: {
            //         marginTop: "10px",
            //         // width: "0.275",
            //         // height: "0.165",
            //         backgroundColor: "0xffffff",
            //         border:{
            //             style: "4"
            //         },
            //         borderWidth: "2",
            //         borderColor: "0xa9a9a9",
            //         "..style.signature.view": null
            //     },
            //     onClick: "..event.signature.click",
            //     children: [
            //         {
            //             type: "image",
            //             path: "null.png",
            //             viewTag: "..formData.data.signature.viewTag",
            //             "path=func": "..event.signature.img",
            //             dataKey: "formData.data.signature.id",
            //             style: {
            //                 top: "0",
            //                 left: "0",
            //                 // width: "0.275",
            //                 // height: "0.165",
            //                 zIndex: "2",
            //                 "..style.signature.img": null
            //             }
            //         },
            //         {
            //             type: "label",
            //             text: "X",
            //             style: {
            //                 // top: "0.1",
            //                 // height: "0.028",
            //                 // width: "0.225",
            //                 // left: "0.025",
            //                 // fontSize: "1.54vw",
            //                 zIndex: "1",
            //                 border: {
            //                     style: "2"
            //                 },
            //                 borderColor: "0x707070",
            //                 borderWidth: "1",
            //                 boxSizing: "content-box",
            //                 textAlign:{
            //                     y: "center"
            //                 },
            //                 "..style.signature.label": null
            //             }
            //         }
            //     ]
            // }
            return { "..customComponents.documentTemplateSignature": null }
        case "Diagnosis":
            return { "..customComponents.documentTemplateDiagnoses": null }
        case "Radio":
            BaseJsonCopy.formData[opts.config.key as string]["dataList"] = []
            BaseJsonCopy.formData[opts.config.key as string]["value"] = ""
            const RadioListArr = (opts.config.list as string).split(textSharpSplitReg)
            RadioListArr.shift()
            RadioListArr.pop()
            for(let i = 0; i < RadioListArr.length; i+=2) {
                if(RadioListArr[i] !== "") {
                    BaseJsonCopy.formData[opts.config.key as string]["dataList"].push(RadioListArr[i])
                    if(RadioListArr[i+1] === "checked") {
                        BaseJsonCopy.formData[opts.config.key as string]["value"] = RadioListArr[i]
                    }
                }
            }
            const RadioAssignmentCancel = {}
            RadioAssignmentCancel["..formData.data." + opts.config.key + ".value@"] = ""
            const RadioAssignment = {}
            RadioAssignment["..formData.data." + opts.config.key + ".value@"] = "$var"
            return {
                type: "view",
                style: {
                    width: "..formData.atrribute.noodl_font.fullWidth",
                    margin: "auto",
                },
                children: [
                    {
                        type: "label",
                        contentType: "html",
                        text: opts.config.title+str,
                        style: {
                            color: "0x333333",
                            width: "..formData.atrribute.noodl_font.fullWidth",
                            fontSize: "..formData.atrribute.noodl_font.text",
                            fontWeight: "600",
                            wordBreak: "break-word"
                        }
                    },
                    {
                        type: "list",
                        viewTag: opts.config.key + "Tag",
                        contentType: "listObject",
                        listObject: "..formData.data." + opts.config.key + ".dataList",
                        iteratorVar: "itemObject",
                        style: {
                            display: "..formData.atrribute.is_edit",
                            width: "..formData.atrribute.noodl_font.fullWidth",
                        },
                        children: [
                            {
                                type: "listItem",
                                itemObject: "",
                                children: [
                                    {
                                        type: "view",
                                        style: {
                                            display: "flex",
                                            alignItems: "center",
                                            width: "..formData.atrribute.noodl_font.fullWidth",
                                        },
                                        children: [
                                            {
                                                type: "image",
                                                style: {
                                                    width: "..formData.atrribute.noodl_font.choice.radio.width",
                                                    marginTop: "0.002"
                                                },
                                                path: {
                                                    emit: {
                                                        dataKey: {
                                                            var: "itemObject"
                                                        },
                                                        actions: [
                                                            {
                                                                if: [
                                                                    {
                                                                        "=.builtIn.string.equal": {
                                                                            dataIn: {
                                                                                string1: "=..formData.data." + opts.config.key + ".value", 
                                                                                string2: "$var"
                                                                            }
                                                                        }
                                                                    },
                                                                    "..formData.atrribute.noodl_font.choice.radio.on",
                                                                    "..formData.atrribute.noodl_font.choice.radio.off"
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                },
                                                onClick: [
                                                    {
                                                        emit: {
                                                            dataKey: {
                                                                var: "itemObject"
                                                            },
                                                            actions: [
                                                                {
                                                                    if: [
                                                                        {
                                                                            "=.builtIn.string.equal": {
                                                                                dataIn: {
                                                                                    string1: "=..formData.data." + opts.config.key + ".value", 
                                                                                    string2: "$var"
                                                                                }
                                                                            }
                                                                        },
                                                                        RadioAssignmentCancel,
                                                                        RadioAssignment,
                                                                    ]
                                                                }
                                                            ]
                                                        }
                                                    },
                                                    {
                                                        actionType: "builtIn",
                                                        funcName: "redraw",
                                                        viewTag:  opts.config.key + "Tag" 
                                                    }
                                                ]
                                            },
                                            {
                                                type: "label",
                                                dataKey: "itemObject",
                                                style: {
                                                    width: "..formData.atrribute.noodl_font.fullWidth",
                                                    marginLeft: "..formData.atrribute.noodl_font.choice.radio.marginLeft",
                                                    fontSize:  "..formData.atrribute.noodl_font.text",
                                                    color: "0x333333",
                                                    wordBreak: "break-word"
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        type: "list",
                        viewTag: opts.config.key + "Tag",
                        contentType: "listObject",
                        listObject: "..formData.data." + opts.config.key + ".dataList",
                        iteratorVar: "itemObject",
                        style: {
                            width: "..formData.atrribute.noodl_font.fullWidth",
                            display: "..formData.atrribute.is_read"
                        },
                        children: [
                            {
                                type: "listItem",
                                itemObject: "",
                                children: [
                                    {
                                        type: "view",
                                        style: {
                                            display: "flex",
                                            alignItems: "center",
                                            width: "..formData.atrribute.noodl_font.fullWidth",
                                        },
                                        children: [
                                            {
                                                type: "image",
                                                style: {
                                                    width: "..formData.atrribute.noodl_font.choice.radio.width",
                                                    marginTop: "0.002"
                                                },
                                                path: {
                                                    emit: {
                                                        dataKey: {
                                                            var: "itemObject"
                                                        },
                                                        actions: [
                                                            {
                                                                if: [
                                                                    {
                                                                        "=.builtIn.string.equal": {
                                                                            dataIn: {
                                                                                string1: "=..formData.data." + opts.config.key + ".value", 
                                                                                string2: "$var"
                                                                            }
                                                                        }
                                                                    },
                                                                    "..formData.atrribute.noodl_font.choice.radio.on",
                                                                    "..formData.atrribute.noodl_font.choice.radio.default"
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                }
                                            },
                                            {
                                                type: "label",
                                                dataKey: "itemObject",
                                                style: {
                                                    width: "..formData.atrribute.noodl_font.fullWidth",
                                                    marginLeft: "..formData.atrribute.noodl_font.choice.radio.marginLeft",
                                                    fontSize:  "..formData.atrribute.noodl_font.text",
                                                    color: "0x333333",
                                                    wordBreak: "break-word"
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                ]
            }
        case "Checkbox":
            BaseJsonCopy.formData[opts.config.key as string]["dataList"] = []
            BaseJsonCopy.formData[opts.config.key as string]["valueList"] = []
            const CheckListArr = (opts.config.list as string).split(textSharpSplitReg)
            CheckListArr.shift()
            CheckListArr.pop()
            for(let i = 0; i < CheckListArr.length; i+=2) {
                if(CheckListArr[i] !== "") {
                    const isCheck = CheckListArr[i+1] === "checked"
                    BaseJsonCopy.formData[opts.config.key as string]["dataList"].push({
                        index: i/2,
                        value: CheckListArr[i],
                        isCheck,
                    })
                    isCheck && BaseJsonCopy.formData[opts.config.key as string]["valueList"].push({
                        key: i/2,
                        value: CheckListArr[i]
                    })
                }
            }
            const CheckboxAssignmentCancel = {
                "=.builtIn.object.set": {
                    dataIn: {
                        object: "$var",
                        key: "isCheck",
                        value: false
                    }
                }
            }
            const CheckboxAssignment = {
                "=.builtIn.object.set": {
                    dataIn: {
                        object: "$var",
                        key: "isCheck",
                        value: true
                    }
                }
            }
            return {
                type: "view",
                style: {
                    width: "..formData.atrribute.noodl_font.fullWidth",
                    margin: "auto",
                },
                children: [
                    {
                        type: "label",
                        contentType: "html",
                        text: opts.config.title+str,
                        style: {
                            color: "0x333333",
                            width: "..formData.atrribute.noodl_font.fullWidth",
                            fontSize: "..formData.atrribute.noodl_font.text",
                            fontWeight: "600",
                            wordBreak: "break-word"
                        }
                    },
                    {
                        type: "list",
                        viewTag: opts.config.key + "Tag",
                        contentType: "listObject",
                        listObject: "..formData.data." + opts.config.key + ".dataList",
                        iteratorVar: "itemObject",
                        style: {
                            width: "..formData.atrribute.noodl_font.fullWidth",
                            display: "..formData.atrribute.is_edit"
                        },
                        children: [
                            {
                                type: "listItem",
                                itemObject: "",
                                children: [
                                    {
                                        type: "view",
                                        style: {
                                            display: "flex",
                                            alignItems: "center",
                                            width: "..formData.atrribute.noodl_font.fullWidth",
                                        },
                                        children: [
                                            {
                                                type: "image",
                                                style: {
                                                    width: "..formData.atrribute.noodl_font.choice.checkbox.width",
                                                    marginTop: "0.002"
                                                },
                                                path: {
                                                    emit: {
                                                        dataKey: {
                                                            var: "itemObject"
                                                        },
                                                        actions: [
                                                            {
                                                                if: [
                                                                    "$var.isCheck",
                                                                    "..formData.atrribute.noodl_font.choice.checkbox.on",
                                                                    "..formData.atrribute.noodl_font.choice.checkbox.off"
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                },
                                                onClick: [
                                                    {
                                                        emit: {
                                                            dataKey: {
                                                                var: "itemObject"
                                                            },
                                                            actions: [
                                                                {
                                                                    if: [
                                                                        "$var.isCheck",
                                                                        {
                                                                            "=.builtIn.array.removeByKey": {
                                                                                dataIn: {
                                                                                    object: "=..formData.data." + opts.config.key + ".valueList",
                                                                                    key: "$var.index"
                                                                                }
                                                                            }
                                                                        },
                                                                        {
                                                                            "=.builtIn.array.add": {
                                                                                dataIn: {
                                                                                    object: "=..formData.data." + opts.config.key + ".valueList",
                                                                                    value: {
                                                                                        key: "$var.index",
                                                                                        value: "$var.value"
                                                                                    }
                                                                                }
                                                                            },
                                                                        }
                                                                    ]
                                                                },
                                                                {
                                                                    if: [
                                                                        "$var.isCheck",
                                                                        CheckboxAssignmentCancel,
                                                                        CheckboxAssignment,
                                                                    ]
                                                                }
                                                            ]
                                                        }
                                                    },
                                                    {
                                                        actionType: "builtIn",
                                                        funcName: "redraw",
                                                        viewTag:  opts.config.key + "Tag" 
                                                    }
                                                ]
                                            },
                                            {
                                                type: "label",
                                                dataKey: "itemObject.value",
                                                style: {
                                                    width: "..formData.atrribute.noodl_font.fullWidth",
                                                    marginLeft: "..formData.atrribute.noodl_font.choice.checkbox.marginLeft",
                                                    fontSize:  "..formData.atrribute.noodl_font.text",
                                                    color: "0x333333",
                                                    wordBreak: "break-word"
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        type: "list",
                        viewTag: opts.config.key + "Tag",
                        contentType: "listObject",
                        listObject: "..formData.data." + opts.config.key + ".dataList",
                        iteratorVar: "itemObject",
                        style: {
                            width: "..formData.atrribute.noodl_font.fullWidth",
                            display: "..formData.atrribute.is_read"
                        },
                        children: [
                            {
                                type: "listItem",
                                itemObject: "",
                                children: [
                                    {
                                        type: "view",
                                        style: {
                                            display: "flex",
                                            alignItems: "center"
                                        },
                                        children: [
                                            {
                                                type: "image",
                                                style: {
                                                    width: "..formData.atrribute.noodl_font.choice.checkbox.width",
                                                    marginTop: "0.002"
                                                },
                                                path: {
                                                    emit: {
                                                        dataKey: {
                                                            var: "itemObject"
                                                        },
                                                        actions: [
                                                            {
                                                                if: [
                                                                    "$var.isCheck",
                                                                    "..formData.atrribute.noodl_font.choice.checkbox.on",
                                                                    "..formData.atrribute.noodl_font.choice.checkbox.default"
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                }
                                            },
                                            {
                                                type: "label",
                                                dataKey: "itemObject.value",
                                                style: {
                                                    width: "..formData.atrribute.noodl_font.fullWidth",
                                                    marginLeft: "..formData.atrribute.noodl_font.choice.checkbox.marginLeft",
                                                    fontSize:  "..formData.atrribute.noodl_font.text",
                                                    color: "0x333333",
                                                    wordBreak: "break-word"
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                ]
            }
        case "Drop Down Box":
            BaseJsonCopy.formData[opts.config.key as string]["dataList"] = []
            BaseJsonCopy.formData[opts.config.key as string]["value"] = ""
            BaseJsonCopy.formData[opts.config.key as string]["listIsShow"] = "none"
            const DropDwonListArr = (opts.config.list as string).split(textSharpSplitReg)
            DropDwonListArr.shift()
            DropDwonListArr.pop()
            for(let i = 0; i < DropDwonListArr.length; i+=2){
                if(DropDwonListArr[i] !== "") {
                    // BaseJsonCopy.formData[opts.config.key as string]["dataList"].push(DropDwonListArr[i])
                    BaseJsonCopy.formData[opts.config.key as string]["dataList"][i/2] = {
                        value: DropDwonListArr[i],
                        backgroundColor: "0xffffff",
                        color: "0x333333"
                    }
                    if(DropDwonListArr[i+1] === "checked") {
                        BaseJsonCopy.formData[opts.config.key as string]["value"] = DropDwonListArr[i]
                        BaseJsonCopy.formData[opts.config.key as string]["dataList"][i/2]["backgroundColor"] = "0x1e90ff"
                        BaseJsonCopy.formData[opts.config.key as string]["dataList"][i/2]["color"] = "0xffffff"
                    }
                }
            }
            const DropDwonAssignmentCancel = {}
            DropDwonAssignmentCancel["..formData.data." + opts.config.key + ".value@"] = ""
            const DropDwonAssignment = {}
            DropDwonAssignment["..formData.data." + opts.config.key + ".value@"] = "$var.value"
            const DropDwonAssignmentListCancel = {}
            DropDwonAssignmentListCancel["..formData.data." + opts.config.key + ".listIsShow@"] = "none"
            const DropDwonAssignmentList = {}
            DropDwonAssignmentList["..formData.data." + opts.config.key + ".listIsShow@"] = "block"
            return {
                type: "view",
                style: {
                    width: "..formData.atrribute.noodl_font.fullWidth",
                    margin: "auto",
                },
                children: [
                    {
                        type: "label",
                        contentType: "html",
                        text: opts.config.title+str,
                        style: {
                            color: "0x333333",
                            width: "..formData.atrribute.noodl_font.fullWidth",
                            fontSize: "..formData.atrribute.noodl_font.text",
                            fontWeight: "600",
                            wordBreak: "break-word"
                        }
                    },
                    {
                        type: "view",
                        style: {
                            width: "..formData.atrribute.noodl_font.fullWidth",
                            display: "..formData.atrribute.is_edit",
                            minHeight: "..formData.atrribute.noodl_font.lineHeight",
                            marginTop: "0.01",
                            border: "1px solid #cccccc",
                            borderRadius: "4px",
                            textAlign: {
                                y: "center"
                            }
                        },
                        children: [
                            {
                                type: "view",
                                viewTag: opts.config.key + "valueTag",
                                style: {
                                    display: "flex",
                                    minHeight: "..formData.atrribute.noodl_font.lineHeight",
                                    width: "..formData.atrribute.noodl_font.fullWidth",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "0 18px",
                                    boxSizing: "border-box"
                                },
                                children: [
                                    {
                                        type: "label",
                                        dataKey: "formData.data." + opts.config.key + ".value",
                                        text: "Select",
                                        style: {
                                            flex: 1
                                        }
                                    },
                                    {
                                        type: "image",
                                        path: {
                                            emit: {
                                                actions: [
                                                    {
                                                        if: [
                                                            {
                                                                "=.builtIn.string.equal": {
                                                                    dataIn: {
                                                                        string1: "=..formData.data." + opts.config.key + ".listIsShow",
                                                                        string2: "block"
                                                                    }
                                                                }
                                                            },
                                                            "..formData.atrribute.noodl_font.choice.dropDown.up",
                                                            "..formData.atrribute.noodl_font.choice.dropDown.down"
                                                        ]
                                                    }
                                                ]
                                            }
                                        },
                                        style: {
                                            width: "..formData.atrribute.noodl_font.choice.dropDown.width"
                                        }
                                    }
                                ]
                            }
                        ],
                        onClick: [
                            {
                                emit: {
                                    actions: [
                                        {
                                            if: [
                                                {
                                                    "=.builtIn.string.equal": {
                                                        dataIn: {
                                                            string1: "=..formData.data." + opts.config.key + ".listIsShow",
                                                            string2: "block"
                                                        }
                                                    }
                                                },
                                                DropDwonAssignmentListCancel,
                                                DropDwonAssignmentList
                                            ]
                                        }
                                    ]
                                }
                            },
                            {
                                actionType: "builtIn",
                                funcName: "redraw",
                                viewTag: opts.config.key + "valueTag",
                            },
                            {
                                actionType: "builtIn",
                                funcName: "redraw",
                                viewTag: opts.config.key + "listTag",
                            }
                        ]
                    },
                    {
                        type: "list",
                        viewTag: opts.config.key + "listTag",
                        containerType: "listObject",
                        listObject: "..formData.data." + opts.config.key + ".dataList",
                        iteratorVar: "itemObject",
                        style: {
                            width: "..formData.atrribute.noodl_font.fullWidth",
                            border: "1px solid #cccccc",
                            borderRadius: "4px",
                            marginTop: "0.002",
                            display: "..formData.data." + opts.config.key + ".listIsShow",
                            overflow: "hidden",
                            position: "absolute",
                            background: "0xffffff",
                            zIndex: "100",
                            boxSizing: "border-box"
                        },
                        children: [
                            {
                                type: "listItem", 
                                itemObject: "",
                                style: {
                                    width: "calc(100%)",
                                    minHeight: "..formData.atrribute.noodl_font.lineHeight",
                                    wordBreak: "break-word",
                                    boxSizing: "border-box"
                                },
                                children: [
                                    {
                                        type: "label",
                                        hover: {
                                            backgroundColor: "0x1e90ff",
                                            color: "0xffffff"
                                        },
                                        dataKey: "itemObject.value",
                                        style: {
                                            backgroundColor: "itemObject.backgroundColor",
                                            color: "itemObject.color",
                                            fontWeight: "600",
                                            width: "calc(100%)",
                                            minHeight: "..formData.atrribute.noodl_font.lineHeight",
                                            textAlign: {
                                                y: "center"
                                            },
                                            padding: "0px 18px",
                                            wordBreak: "break-word",
                                            boxSizing: "border-box"
                                        },
                                        onClick: [
                                            {
                                                emit: {
                                                    dataKey: {
                                                        var: "itemObject"
                                                    },
                                                    actions: [
                                                        DropDwonAssignment,
                                                        DropDwonAssignmentListCancel,
                                                        {
                                                            "=.builtIn.object.setProperty": {
                                                                dataIn: {
                                                                    obj: "=..formData.data." + opts.config.key + ".dataList",
                                                                    label: "value",
                                                                    text: "$var.value",
                                                                    arr: [
                                                                        "backgroundColor",
                                                                        "color"
                                                                    ],
                                                                    valueArr: [
                                                                        "0x1e90ff",
                                                                        "0xffffff"
                                                                    ],
                                                                    errorArr: [
                                                                        "0xffffff",
                                                                        "0x333333"
                                                                    ]
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                actionType: "builtIn",
                                                funcName: "redraw",
                                                viewTag: opts.config.key + "valueTag",
                                            },
                                            {
                                                actionType: "builtIn",
                                                funcName: "redraw",
                                                viewTag: opts.config.key + "listTag",
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        type: "view",
                        style: {
                            marginTop: "0.01",
                            backgroundColor: "0xf4f4f4",
                            width: "..formData.atrribute.noodl_font.fullWidth",
                            boxSizing: "border-box",
                            height: "auto",
                            display: "..formData.atrribute.is_read",
                        },
                        children: [
                            {
                                type: "label",
                                text: "No Content",
                                dataKey: "formData.data." + opts.config.key + ".value",
                                style: {
                                    width: "..formData.atrribute.noodl_font.fullWidth",
                                    height: "auto",
                                    verticalAlign: "middle",
                                    fontSize: "..formData.atrribute.noodl_font.h4",
                                    color: "0x666666",
                                    wordWrap: "break-word",
                                    wordBreak: "break-word",
                                    paddingTop: "0.0046",
                                    paddingBottom: "0.0046",
                                    paddingLeft: "0.0046",
                                    boxSizing: "border-box"
                                } 
                            }
                        ]
                    }
                ]
            }
        default:
            return {
                type: "view",
                style: {
                    width: "..formData.atrribute.noodl_font.fullWidth",
                    margin: "auto"
                },
                children: [
                    {
                        type: "label",
                        contentType: "html",
                        text: opts.type,
                        style: {
                            marginTop: "0.01",
                            // marginBottom: "15px",
                            color: "#333333",
                            fontSize: "..formData.atrribute.noodl_font.text",
                            fontWeight: 600
                        }
                    },
                    {
                        type: "textView",
                        dataKey: "formData.data." + formatKey(opts.type as string),
                        // value: "formData.data." + formatKey(opts.config.title as string),
                        placeholder: "Enter here",
                        contentType,
                        viewTag,
                        style: {
                            display: `..formData.atrribute.is_edit`,
                            marginTop: "0.01",
                            minHeight: "..formData.atrribute.noodl_font.doubleLineHeight",
                            width: "..formData.atrribute.noodl_font.fullWidth",
                            boxSizing: "border-box",
                            textIndent: "0.8em",
                            color: "#333333",
                            outline: "none",
                            border: "2px solid #DEDEDE",
                            borderWidth: "thin",
                            borderRadius: "4px",
                            lineHeight: "..formData.atrribute.noodl_font.lineHeight",
                            padding: "2px"
                        }
                    },
                    {
                        type: "view",
                        style: {
                            marginTop: "0.01",
                            backgroundColor: "0xf4f4f4",
                            width: "..formData.atrribute.noodl_font.fullWidth",
                            boxSizing: "border-box",
                            height: "auto",
                        },
                        children: [
                            {
                                type: "label",
                                // text: "..formData.data." + formatKey(opts.config.title as string),
                                text: "No Content",
                                dataKey: "formData.data." + formatKey(opts.type as string),
                                style: {
                                    display: "..formData.atrribute.is_read",
                                    width: "..formData.atrribute.noodl_font.fullWidth",
                                    height: "auto",
                                    verticalAlign: "middle",
                                    fontSize: "..formData.atrribute.noodl_font.h4",
                                    color: "0x666666",
                                    wordBreak: "break-word",
                                    wordWrap: "break-word",
                                    whiteSpace: "pre-wrap",
                                    paddingTop: "0.0046",
                                    paddingBottom: "0.0046",
                                    paddingLeft: "0.0046",
                                    boxSizing: "border-box"
                                } 
                            }
                        ]
                    }
                ]
            }
    }
}

export default sharpYaml