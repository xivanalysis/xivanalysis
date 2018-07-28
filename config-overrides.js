/* global require, module */
const webpack = require('webpack')
const GitRevisionPlugin = require('git-revision-webpack-plugin')
const rewireEslint = require('react-app-rewire-eslint')
const rewireLodash = require('react-app-rewire-lodash')
const {rewireLingui} = require('react-app-rewire-lingui')

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
	config = rewireLingui(config, env)

	// We have to set the type for lingui files here, rather than doing
	// it inline when we import the files, because webpack 4 decided
	// it would be "helpful" and support JSON by default.
	// Whether you want it to or not.
	config.module.rules.unshift({
		type: 'javascript/auto',
		test: /locale.+\.json$/,
		loader: '@lingui/loader',
	})

	return config
}
