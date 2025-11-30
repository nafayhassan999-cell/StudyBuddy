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
  
  // Exclude test files from build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Exclude test files from type checking during build
    ignoreBuildErrors: false,
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
    
    // Ignore vitest and test-related files during build
    config.externals.push({
      'vitest': 'vitest',
      'vitest/config': 'vitest/config',
      '@vitejs/plugin-react': '@vitejs/plugin-react',
    });
    
    // Ignore warnings from test libraries
    config.ignoreWarnings = [
      { module: /vitest/ },
      { module: /__tests__/ },
    ];
    
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
