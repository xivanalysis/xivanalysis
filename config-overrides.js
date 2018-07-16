/* global require, module */
const webpack = require('webpack')
const GitRevisionPlugin = require('git-revision-webpack-plugin')

module.exports = (config/* , env */) => {
	const gitRevision = new GitRevisionPlugin({
		branch: true,
		commithashCommand: 'rev-parse --short HEAD',
	})

	config.plugins = (config.plugins || []).concat([
		new webpack.DefinePlugin({
			'process.env.VERSION': JSON.stringify(`${gitRevision.branch()}-${gitRevision.commithash()}`),
		}),
	])

	return config
}
