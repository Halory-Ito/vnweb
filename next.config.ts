import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { NextConfig } from 'next'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  outputFileTracingExcludes: {
    '/*': [
      '.agents/**',
      '.claude/**',
      '.git/**',
      '.husky/**',
      '.workbuddy/**',
      'Cargo.lock',
      'Cargo.toml',
      'assets/**',
      'backups/**',
      'crates/**',
      'data/services/**',
      'data/settings/**',
      'docs/**',
      'images/**',
      'local.db*',
      'public/assets/**',
      'target/**',
    ],
  },
  // reactCompiler: true,
  turbopack: {
    root: projectRoot,
  },
  experimental: {
    // 自动按需引入第三方包，大幅缩小打包体积
    optimizePackageImports: ['lucide-react', 'date-fns', '@radix-ui/react-icons', 'lodash-es'],
  },
  logging: {
    incomingRequests: false, // 关闭请求日志
  },
  allowedDevOrigins: [
    'http://localhost:8999',
    'http://192.168.1.6:8999',
    'http://192.168.1.6',
    '10.180.55.235',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    dangerouslyAllowLocalIP: true,
    // unoptimized: true,
  },
  transpilePackages: ['next-mdx-remote'],
  devIndicators: false,
  async redirects() {
    return [
      {
        source: '/game',
        destination: '/game/home',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
