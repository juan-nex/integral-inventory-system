/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.1.*', '10.1.117.180'],
  typescript: {
    ignoreBuildErrors: false,
  },
  devIndicators: false,
  images: {
    unoptimized: true,
  },
}

export default nextConfig
