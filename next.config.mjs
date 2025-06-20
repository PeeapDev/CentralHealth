/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Allow both parameter naming formats in dynamic segments during transition
  experimental: {
    typedRoutes: false,
    allowedDynamicNames: {
      'id': ['id', 'patientId'],
      'patientId': ['id', 'patientId'],
    }
  },
}

export default nextConfig
