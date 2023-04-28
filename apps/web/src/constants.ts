export const id = `aitmed-noodl-web`
export const CACHED_PAGES = 'CACHED_PAGES'
export const DEFAULT_SPINNER_DELAY = 100
export const DEFAULT_SPINNER_TIMEOUT = 30000
export const PATH_TO_REMOTE_PARTICIPANTS_IN_ROOT =
  'VideoChat.listData.participants'
export const __NOODL_SEARCH_CLIENT__ = '__NOODL_SEARCH_CLIENT__'

export enum ActionEvent {
  Anonymous = 'Anonymous',
  BuiltIn = 'BuiltIn',
  Emit = 'Emit',
  EvalObject = 'EvalObject',
  Goto = 'Goto',
  PageJump = 'PageJump',
  PopUp = 'PopUp',
  PopUpDismiss = 'PopUpDismiss',
  Refresh = 'Refresh',
  SaveObject = 'SaveObject',
  ScanCamera = 'ScanCamera',
  RemoveSignature = 'RemoveSignature',
  SaveSignature = 'SaveSignature',
  UpdateObject = 'UpdateObject',
  GetLocationAddress = 'GetLocationAddress',
  UpdateGlobal = 'UpdateGlobal',
}

export const actionMiddlewareLogKey = {
  BUILTIN_GOTO_EXECUTION_TIME: 'builtin-goto-execution-time',
} as const

export const perf = {
  memoryUsage: {
    onChange: `on-change-memory-usage`,
  },
} as const
