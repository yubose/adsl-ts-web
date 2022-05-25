import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { action } from '@storybook/addon-actions'
// import useActionChain from '@/hooks/useActionChain'
import AiTmedContactYml from './AiTmedContact'
import y from 'yaml'
import * as t from '@/types'

const { AiTmedContact } = y.parse(AiTmedContactYml)

export default {
  title: 'useActionChain',
  decorators: [(s: any) => <div style={{ padding: 25 }}>{s()}</div>],
  // parameters: { options: { thmee: { appContentBg: '' } } },
} as ComponentMeta<any>

export const _useActionChain = () => {
  // const actioChain = useActionChain()
  React.useEffect(() => {
    console.log(AiTmedContact)
  }, [])

  return 'heflasfaasfaslo'
}
