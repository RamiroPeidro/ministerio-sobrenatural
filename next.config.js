/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn.sanity.io'], // Permitir imágenes desde el CDN de Sanity
  },
  typescript: {
    // Ignorar errores de TS en producción
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignorar errores de ESLint en producción
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
