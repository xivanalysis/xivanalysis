/* global require, module */
const webpack = require('webpack')
const GitRevisionPlugin = require('git-revision-webpack-plugin')
const rewireEslint = require('react-app-rewire-eslint')

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

	return config
}
