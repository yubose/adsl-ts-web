import * as fp from './utils/fp'
import * as is from './utils/is'
import * as t from './types'

class Diagnostics extends t.ADiagnostics {
  [Symbol.iterator](): Iterator<any, any, any> {
    // @ts-expect-error
    return this.iterator?.getIterator(this.iterator.getItems(this.data))
  }

  constructor() {
    super()
  }

  run(
    data?: any,
    opts?: Parameters<t.ADiagnostics['run']>[1] & { async: true },
  ): Promise<any>

  run(data?: any, opts?: Parameters<t.ADiagnostics['run']>[1]): any

  run(
    data?: any,
    {
      beforeEnter,
      init,
      enter,
      async = false,
    }: Parameters<t.ADiagnostics['run']>[1] = {},
  ) {
    this.data = data

    let prevVisitCallback: t.AVisitor['callback'] | undefined

    if (enter) {
      prevVisitCallback = this.visitor?.callback
      this.visitor?.use(enter)
    }

    const diagnostics = [] as t.DiagnosticObject[]
    const options = { init, data: this.createData({ diagnostics }) }

    const getVisitorProps = (value: any) => {
      const getHelpers = (
        name: string,
        diag: typeof diagnostics,
      ): t.DiagnosticsHelpers => {
        return this.createHelpers({
          add: ({ key, value, messages }) =>
            void diag.push({
              page: name,
              key,
              value,
              messages: messages.map((obj) => ({
                type: obj?.type || 'info',
                message: obj?.message || '',
              })),
            }),
        })
      }

      const helpers = getHelpers(value[0], diagnostics)
      const formattedValue = beforeEnter?.(value)

      return this.createProps({
        helpers,
        value: is.und(formattedValue) ? value : formattedValue,
      })
    }

    try {
      if (async) {
        return new Promise(async (resolve, reject) => {
          try {
            await Promise.all(
              [...this].map((value) => {
                const visitorProps = getVisitorProps(value)
                return this.visitor?.visitAsync(visitorProps.value, {
                  ...options,
                  ...visitorProps.helpers,
                })
              }),
            )
            resolve(diagnostics)
          } catch (error) {
            reject(error instanceof Error ? error : new Error(String(error)))
          }
        })
      } else {
        for (const value of this) {
          const visitorProps = getVisitorProps(value)
          this.visitor?.visit(visitorProps.value, {
            ...options,
            ...visitorProps.helpers,
          })
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      throw err
    } finally {
      if (prevVisitCallback) this.visitor?.use(prevVisitCallback)
    }

    return diagnostics
  }
}

export default Diagnostics
