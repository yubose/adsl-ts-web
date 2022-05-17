import y from 'yaml'

function createSourceTokenFn<Type extends y.CST.SourceToken['type']>(
  type: Type,
) {
  return function tokenFn(options?: Partial<Omit<y.CST.SourceToken, 'type'>>) {
    return {
      type,
      ...options,
    }
  }
}

export const anchor = createSourceTokenFn('anchor')
export const blockScalarHeader = createSourceTokenFn('block-scalar-header')
export const byteOrderMark = createSourceTokenFn('byte-order-mark')
export const comma = createSourceTokenFn('comma')
export const comment = createSourceTokenFn('comment')
export const directiveLine = createSourceTokenFn('directive-line')
export const docMode = createSourceTokenFn('doc-mode')
export const docStart = createSourceTokenFn('doc-start')
export const explicitKeyInd = createSourceTokenFn('explicit-key-ind')
export const flowErrorEnd = createSourceTokenFn('flow-error-end')
export const flowMapStart = createSourceTokenFn('flow-map-start')
export const flowMapEnd = createSourceTokenFn('flow-map-end')
export const flowSeqStart = createSourceTokenFn('flow-seq-start')
export const flowSeqEnd = createSourceTokenFn('flow-seq-end')
export const mapColon = createSourceTokenFn('map-value-ind')
export const newline = createSourceTokenFn('newline')
export const seqColon = createSourceTokenFn('seq-item-ind')
export const space = createSourceTokenFn('space')
export const tag = createSourceTokenFn('tag')

export function blockScalar(
  source: string,
  options?: Partial<Omit<y.CST.BlockScalar, 'type'>>,
) {
  return {
    type: 'block-scalar',
    source,
    ...options,
  } as y.CST.BlockScalar
}

export function blockMap(options?: Partial<Omit<y.CST.BlockMap, 'type'>>) {
  return {
    type: 'block-map',
    ...options,
  } as y.CST.BlockMap
}

export function blockSeq(options?: Partial<Omit<y.CST.BlockSequence, 'type'>>) {
  return {
    type: 'block-seq',
    ...options,
  } as y.CST.BlockSequence
}

export function document(
  options?: Partial<Omit<y.CST.Document, 'type'>>,
): y.CST.Document {
  return {
    type: 'document',
    ...options,
  } as y.CST.Document
}

export function documentEnd(
  options?: Partial<Omit<y.CST.DocumentEnd, 'type'>>,
): y.CST.DocumentEnd {
  return {
    type: 'doc-end',
    ...options,
  } as y.CST.DocumentEnd
}

export function directive(options: Partial<Omit<y.CST.Directive, 'type'>>) {
  return {
    type: 'directive',
    ...options,
  } as y.CST.Directive
}

export function error(options: Partial<Omit<y.CST.ErrorToken, 'type'>>) {
  return {
    type: 'error',
    ...options,
  } as y.CST.ErrorToken
}

function createFlowScalar<Type extends y.CST.FlowScalar['type']>(type: Type) {
  return (options: Partial<Omit<y.CST.FlowScalar, 'type'>>) => {
    return {
      type,
      ...options,
    } as y.CST.FlowScalar
  }
}

export const flowAliasScalar = createFlowScalar('alias')
export const flowScalarScalar = createFlowScalar('scalar')
export const flowSingleQuotedScalar = createFlowScalar('single-quoted-scalar')
export const flowDoubleQuotedScalar = createFlowScalar('double-quoted-scalar')

export function scalar(
  value: any,
  options?: Partial<Omit<y.CST.SourceToken, 'type'>>,
) {
  return {
    type: 'scalar',
    source: value,
    ...options,
  } as y.CST.SourceToken & { type: 'scalar' }
}
