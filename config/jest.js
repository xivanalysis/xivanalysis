const {media, style} = require('neutrino/extensions');
const {isAbsolute, join, relative} = require('path');

// Set up jest. This is mostly copypaste from @neutrinojs/jest, but with tweaks so ts-loader doesn't go spacc
module.exports = neutrino => { neutrino.register('jest', neutrino => {
	// Helpers
	const getFinalPath = path => {
		if (isAbsolute(path)) {
			return path;
		}

		return path.startsWith('.')
			? join('<rootDir>', path)
			: join('<rootDir>', 'node_modules', path);
	}
	const extensionsToNames = extensions => `\\.(${extensions.join('|')})$`;

	const {
		extensions,
		source,
		root,
	} = neutrino.options

	// Other stuff
	const modulesConfig = neutrino.config.resolve.modules.values();
	const aliases = neutrino.config.resolve.alias.entries() || {};

	return {
		// Main config
		rootDir: 'src',
		setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
		testEnvironment: neutrino.config.get('target') === 'node' ? 'node' : 'jsdom',
		bail: true,

		collectCoverageFrom: [join(
			relative(root, source),
			`**/*.{${extensions.join(',')}}`
		)],

		// Extra handling for files and styles and so on
		moduleDirectories: modulesConfig.length ? modulesConfig : ['node_modules'],
		moduleFileExtensions: neutrino.config.resolve.extensions
			.values()
			.map(extension => extension.replace('.', '')),
		moduleNameMapper:
			Object
				.keys(aliases)
				.reduce((mapper, key) => ({
					...mapper,
					[`^${key}$`]: `${getFinalPath(aliases[key])}$1`
				}), {
					[extensionsToNames(style)]: 'identity-obj-proxy'
				}),
		transform: {
			[extensionsToNames(media)]: require.resolve('./fileTransformer'),
			[extensionsToNames(extensions)]: require.resolve('babel-jest')
		},
	}
})}
