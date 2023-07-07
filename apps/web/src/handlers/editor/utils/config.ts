export type SharpType = 
    "TextView"|
    "TextField"|
    "Signature"|
    "Diagnosis" |
    "Radio" |
    "Checkbox" |
    "Drop Down Box"

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
        key?: string,
        list?: string
    },
    isRequired?:boolean
}