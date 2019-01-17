const neutrino = require('neutrino')

const babelLoaderConfig = neutrino().babel()

// Some options are only valid for babel-loader, or only make sense outside a config file - remove them (webpack doesn't use this file, only tools using babel directly).
const removeOptions = [
	'babelrc',
	'cacheDirectory',
	'cacheIdentifier',
	'cacheCompression',
	'configFile',
	'customize',
]
const babelConfig = Object.keys(babelLoaderConfig)
	.filter(key => !removeOptions.includes(key))
	.reduce((obj, key) => {
		obj[key] = babelLoaderConfig[key]
		return obj
	}, {})

module.exports = babelConfig
