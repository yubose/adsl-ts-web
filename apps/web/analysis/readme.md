# Analysis App Setup

> This is still in development. Most of this API will most likely be in a different improved architecture as the project grows

1. Copy `./analysis/app` wherever you want
2. Load the directory through the web app (can point to it using `src/app/noodl.ts`)
3. To analyze a NOODL app just change the `config` key in `Dashboard.yml` (More strategies will be implemented)

Start page is `Dashboard`

Diagnostic messages are generated through one builtin function: `=.builtIn.diagnostics`

The `dataIn` is the `configKey` (example: `admind3`, `testpage`, etc)

Each diagnostic object takes this shape:

```ts
type YAMLNode = Node | Scalar | Pair | YAMLMap | YAMLSeq

type DiagnosticObject<O extends Record<string, any> = Record<string, any>> =
  O & {
    page: string
    key: number | string | null
    node: YAMLNode
    path?: YAMLNode[]
    root: ARoot
    indent?: number
    range?: [start: number, end: number, nodeEnd: number]
    offset?: number
    messages: {
      type: ValidatorType
      message: string
    }[]
  }
```

The types of `node` comes from the `yaml` package. They are an AST node

```ts
import y from 'yaml'

const baseNode = new y.Node()
const scalarNode = new y.Scalar()
const mapNode = new y.YAMLMap()
const seqNode = new y.YAMLSeq()
const pair = new y.Pair()
```
