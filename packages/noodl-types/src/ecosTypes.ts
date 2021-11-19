import type { EmitObjectFold, IfObject } from './uncategorizedTypes'
import type { OrArray } from './_internal/types'

export type RootConfig = {
  /** Example: albh2.aitmed.io */
  apiHost: string
  /**
   * @example: 443
   */
  apiPort: string | number
  /**
   * Can be a variable (example: apiHost which re-uses the value of
   * "apiHost" in the config)
   */
  webApiHost: string
  /**
   * Can be a variable (example: apiHost which re-uses the value of
   * "appApiHost" in the config)
   */
  appApiHost: string
  /**
   * Base url that links in relative format will resolve from
   * For example, if cadlBaseUrl is "http://127.0.0.1:3000", a page referenced
   * in a noodl object like "SignIn" will resolve to:
   * "http://127.0.0.1:3000/SignIn"
   */
  cadlBaseUrl: string
  myBaseUrl: string
  connectiontimeout: string | number
  loadingLevel: number // Defaulted to 1
  /**
   * The file name/path will be the pathname used to grab the "app" config
   * For example, if cadlMain is "cadlEndpoint.yml", the app should pick up
   * "${cadlBaseUrl}/cadlEndpoint.yml" where ${cadlBaseUrl} is a placeholder
   * for the cadlBaseUrl variable
   */
  cadlMain: string
  /** Defaults to "console_log_api" */
  debug: string
  /** If this is specified the app should transform this to a plugin component */
  bodyTopPplugin?: string
  /** If this is specified the app should transform this to a plugin component */
  bodyTailPplugin?: string
  /** If this is specified the app should transform this to a plugin component */
  headPlugin?: string
  /**
   * The timestamp the config was last created or modified.
   * This is used to invalidate the config cache
   */
  timestamp: number
  web: RootConfigDeviceVersionObject
  ios: RootConfigDeviceVersionObject
  android: RootConfigDeviceVersionObject
  keywords: string[]
  viewWidthHeightRatio?: {
    min: number
    max: number
  }
} & Record<DeviceType, RootConfigDeviceVersionObject> & { [key: string]: any }

export interface AppConfig {
  assetsUrl: string
  /** The equivalent of "cadlBaseUrl" from the root config */
  baseUrl: string
  languageSuffix: { [lang: string]: string }
  fileSuffix: string
  /**
   * The default page for user sessions where they haven't visited any pages
   * Also the default page for unauthorized users
   */
  startPage: string
  /** Pages to be loaded before loading other pages */
  preload: string[]
  /** Pages to be loaded and treated as routes in the runtime */
  page: string[]
  [key: string]: any
}

export interface RootConfigDeviceVersionObject {
  cadlVersion: {
    stable: string
    test: string
  }
}

export type BuiltInEvalObject<S extends string = string> = Record<
  ReferenceString<`builtIn${S}`, '=.'>,
  Partial<Record<'dataIn' | 'dataOut', OrArray<DataIn | DataOut>>> | string
>

export type BuiltInEvalReference<S extends string> = ReferenceString<
  `builtIn${S}`,
  '=.'
>

export type DataIn = OrArray<
  string | IfObject | EmitObjectFold | PolymorphicObject
>

export type DataOut = OrArray<
  string | IfObject | EmitObjectFold | PolymorphicObject
>

export type DeviceType = 'web' | 'ios' | 'android'

export type Env = 'stable' | 'test'

export interface EcosDocument<
  NF extends NameField = NameField,
  MT extends MediaType = MediaType,
> {
  id?: string | null
  ctime?: number | null
  mtime?: number | null
  atime?: number | null
  atimes?: number | null
  tage?: number | null
  type?: number | null
  name?: NF | null
  deat?: Deat | null
  size?: number | null
  fid?: string | null
  eid?: string | null
  bsig?: string | null
  esig?: string | null
  created_at?: number | null
  modified_at?: number | null
  subtype?: SubtypeObject<MT> | null
  [key: string]: any
}

export interface NameField<Type extends MimeType.Options = MimeType.Options> {
  tags?: string[]
  title?: string
  data?: string
  type: Type
  user?: string
  [key: string]: any
}

export namespace MimeType {
  export type Options = Audio | Image | Json | Pdf | Text | Video
  // prettier-ignore
  export type Audio = `audio/${'3gp' | 'flac' | 'm4a' | 'mp3' | 'ogg' | 'wav' | 'wma' | 'webm'}`
  // prettier-ignore
  export type Image = `image/${'ai' | 'bmp' | 'eps' | 'gif' | 'jpg' | 'jpeg' | 'png' | 'psd' | 'svg' | 'tiff' | 'webp'}`
  export type Json = 'application/json'
  export type Pdf = 'application/pdf'
  export type Text = `text/${'css' | 'html' | 'javascript' | 'plain'}`
  // prettier-ignore
  export type Video = `video/${'avi' | 'flv' | 'mkv' | 'mov' | 'mpg' | 'mp4' | 'ogg' | 'webm' | 'wmv'}`
}

export interface SubtypeObject<MT extends MediaType = MediaType> {
  isOnServer?: null | boolean
  isZipped?: null | boolean
  isBinary?: null | boolean
  isEncrypted?: null | boolean
  isEditable?: null | boolean
  applicationDataType?: null | number
  mediaType?: null | MT
  size?: null | number
  [key: string]: any
}

export type Deat = DeatObject | number

export interface DeatObject {
  url?: string
  sig?: string
  exptime?: string
  [key: string]: any
}

export type MediaType =
  | AudioMediaType
  | DocMediaType
  | FontMediaType
  | ImageMediaType
  | MessageMediaType
  | ModelMediaType
  | MultipartMediaType
  | OtherMediaType
  | TextMediaType
  | VideoMediaType

export type OtherMediaType = 0
export type DocMediaType = 1
export type AudioMediaType = 2
export type FontMediaType = 3
export type ImageMediaType = 4
export type MessageMediaType = 5
export type ModelMediaType = 6
export type MultipartMediaType = 7
export type TextMediaType = 8
export type VideoMediaType = 9

export type ReferenceSymbol = '.' | '..' | '=' | '~/' | '@'

export type ReferenceString<
  K extends string = string,
  S extends ReferenceSymbol | '=.' | '=..' = ReferenceSymbol | '=.' | '=..',
> = S extends '.'
  ? `.${K}`
  : S extends '..'
  ? `..${K}`
  : S extends '=.'
  ? `=${Extract<ReferenceSymbol, '.'> | never}${K}`
  : S extends '=..'
  ? `=${Extract<ReferenceSymbol, '..'> | never}${K}`
  : S extends '='
  ? `=${Extract<ReferenceSymbol, '.' | '..'> | never}${K}`
  : S extends '~/'
  ? `~/${K}`
  : S extends '@'
  ? `${K}@`
  :
      | `=.${K}`
      | `=..${K}`
      | `${Exclude<ReferenceSymbol, '@'>}${K}`
      | `${K}${Extract<ReferenceSymbol, '@'>}`

export type ReferenceObject<K extends string = string, V = any> = Record<
  K extends ReferenceString ? ReferenceString : K,
  OrArray<V>
>
/**
 * Polymorphic objects are object literals where keys are either plain strings
 * or string references, and their value is also either a plain string or
 * reference string, or another arbitrary object, or an array of arbitrary
 * objects/strings/reference strings/arrays etc.
 */
export type PolymorphicObject = ReferenceObject<
  string,
  OrArray<ReferenceObject<ReferenceString, ReferenceObject>>
>
