const getPlugins = ({
	isTypescript = false,
	isTSX = false,
} = {}) => [
	'./config/babel-plugin-xiva-dependency',
	isTypescript && ['@babel/plugin-transform-typescript', {
		isTSX,
		allowDeclareFields: true,
	}],
	['@babel/plugin-proposal-decorators', {version: "2023-11"}],
	'@babel/plugin-transform-class-properties',
	'babel-plugin-macros',
	'babel-plugin-lodash',
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
			bugfixes: true,
			// If running under register, we need to swap down to node target, otherwise
			// permit fallback to browserslist config handling.
			...api.caller(needsNodeTarget)
				? {targets: {node: true}, include: ['proposal-class-static-block']}
				: {},
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
