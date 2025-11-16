/** @type {import('next').NextConfig} */

import pwa from '@ducanh2912/next-pwa';

const withPWA = pwa({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  // Your Next.js config options here
};

export default withPWA(nextConfig);
