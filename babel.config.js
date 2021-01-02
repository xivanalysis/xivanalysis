module.exports = api => ({
	presets: [
		'@babel/preset-env',
		['@babel/preset-react', {
			development: api.env('development'),
			runtime: 'automatic',
		}],
		'@babel/preset-typescript',
	],
	plugins: [
		['@babel/plugin-proposal-decorators', {legacy: true}],
		['@babel/plugin-proposal-class-properties', {loose: true}],
		'babel-plugin-macros',
	],
})
