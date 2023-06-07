import { SharpYamlOption } from "../utils/config"
import formatKey from "../utils/format"

const sharpYaml = (opts: SharpYamlOption) => {
    let str = opts.isRequired ? `<span style="color:red"> *</span>` : ''
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
        default:
            return {}
    }
}

export default sharpYaml