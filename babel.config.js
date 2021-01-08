const getPlugins = ({
	isTypescript = false,
	isTSX = false,
} = {}) => [
	'./config/babel-plugin-xiva-dependency',
	isTypescript && ['@babel/plugin-transform-typescript', {
		isTSX,
		allowDeclareFields: true,
	}],
	['@babel/plugin-proposal-decorators', {legacy: true}],
	['@babel/plugin-proposal-class-properties', {loose: true}],
	'babel-plugin-macros',
	'babel-plugin-lodash',
	'./locale/babel-plugin-transform-react.js',
	['@babel/plugin-transform-runtime', {
		corejs: {version: 3},
		// TODO: Enable for web build only?
		// useESModules: true,
		version: '^7.12.5',
	}],
].filter(item => !!item)

module.exports = api => ({
	presets: [
		'@babel/preset-env',
		['@babel/preset-react', {
			development: api.env('development'),
			runtime: 'automatic',
		}],
	],

	overrides: [{
		test: /\.jsx?$/,
		plugins: getPlugins(),
	}, {
		test: /\.ts$/,
		plugins: getPlugins({isTypescript: true}),
	}, {
		test: /\.tsx$/,
		plugins: getPlugins({isTypescript: true, isTSX: true}),
	}],
})
