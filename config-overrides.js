/* global require, module */
const webpack = require('webpack')
const GitRevisionPlugin = require('git-revision-webpack-plugin')
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

	return config
}
