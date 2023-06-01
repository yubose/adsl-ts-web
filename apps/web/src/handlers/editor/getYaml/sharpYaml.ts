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
                        type: "view",
                        text: opts.config.title+str,
                        style: {
                            margin: "15px 0",
                            color: "#333333",
                            fontSize: "1.039vw",
                            fontWeight: 600
                        }
                    },
                    {
                        type: "textField",
                        dataKey: "formData.data." + formatKey(opts.config.title as string),
                        value: "formData.data." + formatKey(opts.config.title as string),
                        placeholder: opts.config.placeholder,
                        style: {
                            display: `=..formData.atrribute._isEdit`,
                            minHeight: "40px",
                            width: "calc(100%)",
                            boxSizing: "border-box",
                            textIndent: "0.8em",
                            borderColor: "#DEDEDE",
                            color: "#333333",
                            outline: "none",
                            borderStyle: "solid",
                            borderWidth: "thin",
                            borderRadius: "4px"
                        }
                    },
                    {
                        type: "view",
                        text: "..formData.data." + formatKey(opts.config.title as string),
                        style: {
                            display: "=..formData.atrribute._isRead",
                            wordWrap: "break-word"
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
                        type: "view",
                        text: opts.config.title+str,
                        style: {
                            margin: "15px 0",
                            color: "#333333",
                            fontSize: "1.039vw",
                            fontWeight: 600
                        }
                    },
                    {
                        type: "textView",
                        dataKey: "formData.data." + formatKey(opts.config.title as string),
                        value: "formData.data." + formatKey(opts.config.title as string),
                        placeholder: opts.config.placeholder,
                        style: {
                            display: `=..formData.atrribute._isEdit`,
                            minHeight: "80px",
                            width: "calc(100%)",
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
                        text: "..formData.data." + formatKey(opts.config.title as string),
                        style: {
                            display: "=..formData.atrribute._isRead",
                            wordWrap: "break-word"
                        } 
                    }
                ]
            }
        default:
            return {}
    }
}

export default sharpYaml