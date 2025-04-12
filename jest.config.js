/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

module.exports = {
	// An array of directory names to be searched recursively up from the requiring module's location
	moduleDirectories: [
		'src',
		'node_modules',
	],

	// A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
	moduleNameMapper: {
		'\\.css$': 'identity-obj-proxy',
	},

	// A list of paths to directories that Jest should use to search for files in
	roots: [
		'<rootDir>/src',
	],

	// A list of paths to modules that run some code to configure or set up the testing framework before each test
	setupFilesAfterEnv: [
		'./config/jest.setup.js',
	],

	// A map from regular expressions to paths to transformers
	transform: {
		'\\.[jt]sx?$': 'babel-jest',
		'\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': './config/fileTransformer.js',
	},

	// An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
	// We're re-including a number of node_modules into the transformation, as they're ESM-only.
	// TODO: Reevaluate jest transformation pipelines.
	transformIgnorePatterns: [
		'node_modules/(?!.pnpm|ky|@compiled|@babel/runtime-corejs3|d3-|internmap)',
		'\\.pnp\\.[^\\/]+$',
	],
}
