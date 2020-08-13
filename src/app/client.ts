import CADL from '@aitmed/cadl'

export const cadl = new CADL({
  cadlVersion: process.env.REACT_APP_ECOS_ENV === 'stable' ? 'stable' : 'test',
  configUrl: `https://public.aitmed.com/config${
    process.env.NODE_ENV === 'development' ? '/meetdev.yml' : ''
  }`,
})
