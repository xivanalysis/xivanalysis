/* eslint-disable @typescript-eslint/no-var-requires */

module.exports = {
	plugins: [
		require('autoprefixer'),
		require('postcss-modules-values-replace')({
			resolve: {
				modules: ['src'],
				extensions: ['.css'],
			},
		}),
		require('postcss-color-function')(),
		require('postcss-calc'),
		require('cssnano')({
			preset: ['default', {
				// Need to disable this, it mangles relative imports which freaks other loaders out
				normalizeUrl: false,
			}],
		}),
		require('postcss-modules-tilda'),
	],
}
