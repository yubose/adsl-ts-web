import { SharpYamlOption } from "../utils/config"
import formatKey from "../utils/format"

const sharpYaml = (opts: SharpYamlOption) => {
    let str = opts.isRequired ? `<span style="color:red"> *</span>` : ''
    let contentType = opts.isRequired ? 'strictLength' : null
    switch (opts.type) {
        case "textField": 
            return {
                type: "view",
                style: {
                    width: "calc(100%)",
                    margin: "auto"
                },
                children: [
                    {
                        type: "label",
                        contentType: "html",
                        text: opts.config.title+str,
                        style: {
                            marginTop: "15px",
                            marginBottom: "15px",
                            color: "#333333",
                            fontSize: "=..formData.atrribute.noodl_font.text",
                            fontWeight: 600
                        }
                    },
                    {
                        type: "textField",
                        dataKey: "formData.data." + formatKey(opts.config.title as string),
                        value: "formData.data." + formatKey(opts.config.title as string),
                        placeholder: opts.config.placeholder,
                        contentType,
                        style: {
                            display: `=..formData.atrribute.is_edit`,
                            minHeight: "40px",
                            width: "calc(100%)",
                            boxSizing: "border-box",
                            textIndent: "0.8em",
                            color: "#333333",
                            outline: "none",
                            border: "2px solid #DEDEDE",
                            borderWidth: "thin",
                            borderRadius: "4px"
                        }
                    },
                    {
                        type: "view",
                        text: "..formData.data." + formatKey(opts.config.title as string),
                        style: {
                            display: "=..formData.atrribute.is_read",
                            wordWrap: "break-word",
                            marginTop: "15px"
                        } 
                    }
                ]
            }
        case "textView":
            return {
                type: "view",
                style: {
                    width: "calc(100%)",
                    margin: "auto"
                },
                children: [
                    {
                        type: "label",
                        contentType: "html",
                        text: opts.config.title+str,
                        style: {
                            marginTop: "15px",
                            marginBottom: "15px",
                            color: "#333333",
                            fontSize: "=..formData.atrribute.noodl_font.text",
                            fontWeight: 600
                        }
                    },
                    {
                        type: "textView",
                        dataKey: "formData.data." + formatKey(opts.config.title as string),
                        value: "formData.data." + formatKey(opts.config.title as string),
                        placeholder: opts.config.placeholder,
                        contentType,
                        style: {
                            display: `=..formData.atrribute.is_edit`,
                            minHeight: "80px",
                            width: "calc(100%)",
                            boxSizing: "border-box",
                            textIndent: "0.8em",
                            color: "#333333",
                            outline: "none",
                            border: "2px solid #DEDEDE",
                            borderWidth: "thin",
                            borderRadius: "4px",
                            lineHeight: "40px"
                        }
                    },
                    {
                        type: "view",
                        text: "..formData.data." + formatKey(opts.config.title as string),
                        style: {
                            display: "=..formData.atrribute.is_read",
                            wordWrap: "break-word",
                            marginTop: "15px"
                        } 
                    }
                ]
            }
        case "signature":
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
            return { "..DocumentTemplateSignature": null }
        default:
            return {}
    }
}

export default sharpYaml