import CADL from '@aitmed/cadl'
import NOODL from 'noodl-ui'

export const cadl = new CADL({
  cadlVersion: process.env.ECOS_ENV === 'stable' ? 'stable' : 'test',
  configUrl: `https://public.aitmed.com/config${
    process.env.NODE_ENV === 'development' ? '/meetdev.yml' : ''
  }`,
})

export const noodl = new NOODL()
