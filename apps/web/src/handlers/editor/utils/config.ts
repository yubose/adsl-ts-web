export type SharpType = "textView"|"textField"

export interface SharpOption {
    html: string
    split: string
    type: SharpType
    config: {
        title?: string,
        placeholder?: string
    }
}

export interface SharpYamlOption {
    type: SharpType
    config: {
        title?: string,
        placeholder?: string
    },
    isRequired?:boolean
}