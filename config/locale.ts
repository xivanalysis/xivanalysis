import glob from 'glob'
import _ from 'lodash'
import linguiConfig from '../.linguirc.json'

export function calculateLocaleCompletion(): Record<string, number> {
	// Locale completion calc
	// Pull in all the locale files
	const localeFiles = glob.sync('../locale/*/messages.json', {cwd: __dirname})
	const localeKeyRegex = /\/(\w{2})\/messages/
	const localeCount = {}
	localeFiles.forEach(file => {
		const localeKey = localeKeyRegex.exec(file)[1]
		const data = require(file) as Record<string, string>
		localeCount[localeKey] = Object.values(data)
			.reduce((carry, value) => carry + (value? 1 : 0), 0)
	})

	// Calculate the completion
	const {sourceLocale} = linguiConfig
	return _.reduce(localeCount, (carry, value, key) => {
		carry[key] = ((value / localeCount[sourceLocale]) * 100).toFixed(0)
		return carry
	}, {})
}
