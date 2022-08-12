/**
 * TODO - Rewrite useActionChain with this one
 */
import * as nt from 'noodl-types'
import * as u from '@jsmanifest/utils'
import React from 'react'
import get from 'lodash/get'
import set from 'lodash/set'
import partial from 'lodash/partial'
import { navigate } from 'gatsby'
import { excludeIteratorVar, trimReference, toDataPath } from 'noodl-utils'
import {
  createAction,
  createActionChain as nuiCreateActionChain,
  deref,
} from 'noodl-ui'
import type { NUIActionObject, NUIActionChain, NUITrigger } from 'noodl-ui'
import is from '@/utils/is'
import isBuiltInEvalFn from '@/utils/isBuiltInEvalFn'
import log from '@/utils/log'
import useBuiltInFns from '@/hooks/useBuiltInFns'
import useCtx from '@/useCtx'
import { createDraft, finishDraft, isDraft, toCurrent } from '@/utils/immer'
import { usePageCtx } from '@/components/PageContext'
import * as c from '../constants'
import * as t from '@/types'

export interface UseActionChainOptions {}

export interface ExecuteArgs {
  action: Record<string, any> | string
  actionChain: NUIActionChain
  component?: t.StaticComponentObject
  dataObject?: any
  event?: React.SyntheticEvent
  trigger?: NUITrigger | ''
}

export interface ExecuteHelpers {
  requiresDynamicHandling: (obj: any) => boolean
}

function useActionChainv2() {
  const { root, getR, setR } = useCtx()
  const pageCtx = usePageCtx()
  const { handleBuiltInFn } = useBuiltInFns()

  const getRootDraftOrRoot = React.useCallback(
    (a: NUIActionChain) => a?.data?.get?.(c.ROOT_DRAFT) || root,
    [root],
  )

  const getPageName = React.useCallback(() => pageCtx.name, [pageCtx.name])

  const execute = React.useCallback(
    async (actionProp: any, args: { actionChain: any }) => {
      try {
        // TEMP sharing goto destinations and some strings as args
        if (u.isStr(actionProp)) {
          if (actionProp === '.WebsitePathPsearch') {
            // Hardcode for now
            return 'https://search.aitmed.com'
          }

          // Scroll to a position on this same page
          if (actionProp.startsWith('^')) {
            // TODO - Handle goto scrolls when navigating to a different page
            let scrollingTo = actionProp.substring(1)
            actionProp = actionProp.substring(1)

            const scrollToElem = document.querySelector(
              `[data-viewtag=${scrollingTo}]`,
            )

            if (scrollToElem) {
              scrollToElem.id = scrollingTo
              scrollToElem.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
              })
            } else {
              await navigate(`/${actionProp}/index.html`)
            }
          } else if (actionProp) {
            window.location.href = actionProp
          }

          if (is.reference(actionProp)) {
            return deref({
              root: getRootDraftOrRoot(args?.actionChain),
              ref: actionProp,
              rootKey: getPageName(),
            })
          }
        }

        // These are values coming from an if object evaluation since we are also using this function for if object strings
        if (is.isBoolean(actionProp)) {
          return is.isBooleanTrue(actionProp)
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        log.error(err)
      }
    },
    [],
  )

  return {
    execute,
  }
}

export default useActionChainv2
