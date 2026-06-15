/** @type {import('next').NextConfig} */
const nextConfig = {
  // TODO: เปลี่ยน basePath ถ้า deploy ภายใต้ subdirectory
  // basePath: '/dashboard',
  reactStrictMode: true,
  // puppeteer spawn Chromium — ต้องไม่ bundle (require ตรงๆ ฝั่ง server เท่านั้น)
  experimental: {
    serverComponentsExternalPackages: ['puppeteer'],
  },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // pptxgenjs อ้าง node:fs/node:https (เฉพาะตอนรันใน Node) — ฝั่ง browser ไม่ใช้
      // 1) strip prefix "node:" ให้ webpack resolve ได้  2) map fs/http(s) → false
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, '')
        })
      )
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        https: false,
        http: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
