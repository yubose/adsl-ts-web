export declare class INoodlValue<T = any> {
  constructor(value?: T)
  getValue(...args: any[]): any
  setValue(value: any): this
}

export type EcosDocPreset =
  | 'audio'
  | 'docx'
  | 'image'
  | 'subtype'
  | 'message'
  | 'note'
  | 'pdf'
  | 'text'
  | 'video'

export type Path = (string | number)[]
