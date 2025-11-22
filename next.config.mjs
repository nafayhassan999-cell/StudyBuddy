/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  reactStrictMode: true,
  swcMinify: true,
  
  // Disable trailing slashes for clean URLs
  trailingSlash: false,
  
  images: {
    remotePatterns: [],
    unoptimized: false,
  },
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias.canvas = false;
      config.resolve.alias.encoding = false;
    }
    
    // Fix for PDF libraries
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push('canvas');
    }
    
    return config;
  },
};

export default nextConfig;
