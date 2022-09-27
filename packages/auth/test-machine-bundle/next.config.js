/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	swcMinify: true,
};

const withBundleAnalyzer = require('@next/bundle-analyzer')({
	enabled: process.env.ANALYZE === 'true',
});
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin');

module.exports = withBundleAnalyzer({
	...nextConfig,
	webpack: (config, options) => {
		if (!options.isServer) {
			config.plugins.push(new DuplicatePackageCheckerPlugin());
			config.node = false;
			// config.resolve.alias.buffer = false;
			config.resolve.alias.bowser = false;
		}

		return config;
	},
});
