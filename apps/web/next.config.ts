import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@carousel-forge/types'],
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default config
