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
  
  webpack: (config, { isServer, dev }) => {
    if (isServer) {
      config.resolve.alias.canvas = false;
      config.resolve.alias.encoding = false;
    }
    
    // Fix for PDF libraries
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push('canvas');
    }
    
    // Optimize cache performance - reduce serialization warnings
    if (dev) {
      config.infrastructureLogging = {
        level: 'error',
      };
    }
    
    // Optimize cache to handle large strings
    config.cache = {
      ...config.cache,
      compression: 'gzip',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    };
    
    return config;
  },
};

export default nextConfig;
