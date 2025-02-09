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
	['@babel/plugin-proposal-private-methods', {loose: true}],
	'babel-plugin-macros',
	'babel-plugin-lodash',
	'./locale/babel-plugin-transform-react.js',
	['@babel/plugin-transform-runtime', {
		corejs: {version: 3},
		useESModules: true,
		version: '^7.12.5',
	}],
].filter(item => !!item)

const needsNodeTarget = caller =>
	caller?.name === '@babel/register'
	|| caller?.name === '@babel/node'
	|| caller?.name === 'babel-jest'

module.exports = api => ({
	presets: [
		['@babel/preset-env', {
			// If running under register, we need to swap down to node target, otherwise
			// permit fallback to browserslist config handling.
			targets: api.caller(needsNodeTarget)
				? {node: true}
				: undefined,
		}],
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
