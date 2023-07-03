import { SharpYamlOption } from "../utils/config"
import formatKey from "../utils/format"

const sharpYaml = (opts: SharpYamlOption) => {
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
                                    // wordWrap: "break-word",
                                    // marginTop: "0.01",
                                    // minHeight: "80px",
                                    width: "..formData.atrribute.noodl_font.fullWidth",
                                    height: "auto",
                                    // lineHeight: "40px",
                                    verticalAlign: "middle",
                                    fontSize: "..formData.atrribute.noodl_font.h4",
                                    color: "0x666666",
                                    wordWrap: "break-word",
                                    marginLeft: "0.0046",
                                    paddingTop: "0.0046",
                                    paddingBottom: "0.0046",
                                } 
                            }
                        ]
                    }
                ]
            }
    }
}

export default sharpYaml