export type SharpType = 
    "TextView"|
    "TextField"|
    "Signature"|
    "Diagnosis"

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
        id?: string
    },
    isRequired?:boolean
}