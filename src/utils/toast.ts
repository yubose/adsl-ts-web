import { toast, ToastContent, ToastOptions } from 'react-toastify'

export interface ToastAlerts {
  error: (content: ToastContent, options?: ToastOptions | undefined) => any
  info: (content: ToastContent, options?: ToastOptions | undefined) => any
  success: (content: ToastContent, options?: ToastOptions | undefined) => any
  warn: (content: ToastContent, options?: ToastOptions | undefined) => any
}

const _toast = (function () {
  let id: React.ReactText = ''

  /**
   * Wraps a toast method to inject an additional feature where it avoids duplicate toasts
   * Pass in a toastId as options for that to work
   * @param { function } toastFn - Original toast notification method (ex: toast.info, toast.success)
   */
  const wrapToast = (toastFn: typeof toast.success) => {
    return (content: ToastContent, options?: ToastOptions | undefined) => {
      if (toast.isActive(id)) {
        toast.dismiss(id)
      }
      id = content as string
      toastFn(content, options)
    }
  }

  return {
    error: wrapToast(toast.error),
    info: wrapToast(toast.info),
    success: wrapToast(toast.success),
    warn: wrapToast(toast.warn),
  }
})()

export default _toast
