import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = join(__dirname, '..')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: false,
  },
  devIndicators: false,
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: workspaceRoot,
  turbopack: {
    root: workspaceRoot,
  },
  webpack: (config, { dev }) => {
    // Avoid eval-based source maps so CSP can stay strict during development.
    if (dev) {
      config.devtool = 'source-map'
    }
    return config
  },
}

export default nextConfig
