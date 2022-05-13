export enum Kind {
  Unknown = 0,
  Scalar = 1,
  Pair = 2,
  Map = 3,
  Seq = 4,
}

export enum ScalarKind {
  String = 10,
  Number = 11,
  Object = 12,
  Array = 13,
  Null = 14,
  Undefined = 15,
}

export enum StringKind {
  Reference = 20,
  ContentType = 22,
}

export enum MapKind {
  Action = 100,
  Component = 101,
  Emit = 102,
  Goto = 103,
  If = 104,
  Style = 105,
  BuiltInFn = 106,
}

export enum SeqKind {
  UserEvent = 200,
  Actions = 201,
  EvalObject = 202,
}
