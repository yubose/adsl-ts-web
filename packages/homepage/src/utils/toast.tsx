import React from 'react'
import * as u from '@jsmanifest/utils'
import { toast as _toast, ToastOptions } from 'react-toastify'
import { Box, Text } from 'theme-ui'

function toast(
  opts: string | JSX.Element | ToastOptions | Error,
  type: ToastOptions['type'] = 'info',
) {
  const isError = opts instanceof Error

  const content =
    React.isValidElement(opts) ||
    (u.isStr(opts) && opts) ||
    (isError && (
      <Box>
        <Text color="red">{opts.name}</Text>:{' '}
        <Text color="red">{opts.message}</Text>
      </Box>
    )) ||
    null

  const options: ToastOptions = {
    ...((u.isObj(opts) && !React.isValidElement(opts) && !isError && opts) ||
      undefined),
    type: isError ? 'error' : type,
  }

  return _toast(content, options)
}

export default toast
