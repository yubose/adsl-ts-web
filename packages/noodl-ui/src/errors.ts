export class AbortExecuteError extends Error {
  public name: string = 'AbortExecuteError'

  constructor(message: string) {
    super(message)
  }
}
