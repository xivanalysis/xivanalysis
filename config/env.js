const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')
const fs = require('fs')
const glob = require('glob')
const _ = require('lodash')
const {DefinePlugin} = require('webpack')

const packageJson = require('../package.json')

// Load the environment files
const {NODE_ENV} = process.env
const envFile = '.env'
const envFiles = [
	`${envFile}.${NODE_ENV}.local`,
	`${envFile}.${NODE_ENV}`,
	NODE_ENV !== 'test' && `${envFile}.local`,
	envFile
].filter(Boolean)
envFiles.forEach(path => {
	if (!fs.existsSync(path)) { return }
	dotenvExpand(dotenv.config({path}))
})

module.exports = neutrino => {
	// Locale completion calc
	// Pull in all the locale files
	const localeFiles = glob.sync('../locale/*/messages.json', {cwd: __dirname})
	const localeKeyRegex = /\/(\w{2})\/messages/
	const localeCount = {}
	localeFiles.forEach(file => {
		const localeKey = localeKeyRegex.exec(file)[1]
		const data = require(file)
		localeCount[localeKey] = Object.values(data)
			.reduce((carry, value) => carry + (value? 1 : 0), 0)
	})

	// Calculate the completion
	const sourceLocale = packageJson.lingui.sourceLocale
	const localeCompletion = _.reduce(localeCount, (carry, value, key) => {
		carry[key] = ((value / localeCount[sourceLocale]) * 100).toFixed(0)
		return carry
	}, {})

	// Need to remove the leading slash, that's not expected to be included when using the path
	const publicPath = neutrino.config.output.get('publicPath').replace(/^\//, '')

	const keys = Object.keys(process.env).filter(key => /^REACT_APP_/i.test(key))
	neutrino.config.plugin('env')
		.use(new DefinePlugin({
			'process.env': keys.reduce((env, key) => {
				env[key] = JSON.stringify(process.env[key])
				return env
			}, {
				NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
				LOCALE_COMPLETION: localeCompletion,
				PUBLIC_URL: JSON.stringify(publicPath),
			})
		}))
}
