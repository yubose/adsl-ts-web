export function getRequestState(options?: any) {
  return {
    pending: false,
    success: false,
    error: null,
    timedOut: false,
    ...options,
  }
}
