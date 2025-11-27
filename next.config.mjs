/** @type {import('next').NextConfig} */

import createNextIntlPlugin from "next-intl/plugin"
const withNextIntl = createNextIntlPlugin()

const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@countrystatecity/countries"],
  experimental: {
    serverComponentsExternalPackages: ["@countrystatecity/countries"],
  },
  redirects: async () => {
    return [
      {
        source: "/",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/home",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/en",
        destination: "/en/contact",
        permanent: true,
      },
      {
        source: "/en/",
        destination: "/en/contact",
        permanent: true,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
