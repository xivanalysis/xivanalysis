/* global require, module */
const webpack = require('webpack')
const GitRevisionPlugin = require('git-revision-webpack-plugin')
const {injectBabelPlugin} = require('react-app-rewired')
const rewireEslint = require('react-app-rewire-eslint')
const rewireLodash = require('react-app-rewire-lodash')

module.exports = (config, env) => {
	const gitRevision = new GitRevisionPlugin({
		commithashCommand: 'rev-parse --short HEAD',
	})

	config.plugins = (config.plugins || []).concat([
		new webpack.DefinePlugin({
			'process.env.VERSION': JSON.stringify(gitRevision.commithash()),
		}),
	])

	config = rewireEslint(config, env)
	config = rewireLodash(config, env)

	config = injectBabelPlugin('@lingui/babel-plugin-transform-js', config)
	config = injectBabelPlugin('./locale/babel-plugin-transform-react', config)

	// We have to set the type for lingui files here, rather than doing
	// it inline when we import the files, because webpack 4 decided
	// it would be "helpful" and support JSON by default.
	// Whether you want it to or not.
	config.module.rules.unshift({
		type: 'javascript/auto',
		test: /locale.+\.json$/,
		loader: '@lingui/loader',
	})

	// Tweaking chunk splitting so intl polyfill doens't get pulled in
	config.optimization.splitChunks.chunks = chunk => {
		if (!chunk.name) { return true }
		return !chunk.name.includes('nv-')
	}

	return config
}
