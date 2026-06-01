import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  // reactCompiler: true,
  experimental: {
    // 自动按需引入第三方包，大幅缩小打包体积
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@radix-ui/react-icons',
      'lodash-es',
    ],
  },
  logging: {
    incomingRequests: false, // 关闭请求日志
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    dangerouslyAllowSVG: true,
  },
  transpilePackages: ['next-mdx-remote'],
  output: 'standalone',
}

export default nextConfig
