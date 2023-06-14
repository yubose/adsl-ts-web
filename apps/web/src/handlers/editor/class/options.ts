import { IDomEditor } from '@wangeditor/editor'

export interface defaultOptions{
    title: string
    width?: number
    classFunctions?: ClassFunction
}

export interface ClassFunction {
    getValue?: (editor: IDomEditor) => string | boolean 
    isActive?: (editor: IDomEditor) => boolean
    isDisabled?: (editor: IDomEditor) => boolean 
    getOptions?: (editor: IDomEditor) => void
    exec?: (editor: IDomEditor, value: string | boolean) => void
}

export interface selectOptions extends defaultOptions {
    options: Array<VALUE>
    // callback: (editor: IDomEditor, value: string | boolean) => void
}

export interface buttonOptions extends defaultOptions {
    svg?: string
    // callback: (editor: IDomEditor, value: string | boolean) => void
}

export interface VALUE {
    value: string;
    text: string;
    selected?: boolean;
    styleForRenderMenuList?: {
        [key: string]: string;
    };
}