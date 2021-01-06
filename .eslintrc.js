module.exports = {
	root: true,
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
	],

	// TODO: Might need to use both babel-eslint and typescript-eslint depending on filetype?
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],

	env: {
		browser: true,
		commonjs: true,
		es6: true,
	},

	globals: {
		// process.env injected by webpack
		process: true,
	},

	rules: {
		// #region Migration required
		// TODO: Migrate disable to JS-only
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		// TODO: Enable
		'@typescript-eslint/no-inferrable-types': 'off',
		// TODO: Enable
		'@typescript-eslint/no-explicit-any': 'off',
		// TODO: Enable for JS.
		// TODO: Enable for TS, will likely need arg pattern allow for base classes &c
		'@typescript-eslint/no-unused-vars': 'off',
		// TODO: Should probably enable
		'no-case-declarations': 'off',
		// TODO: Enable
		'no-prototype-builtins': 'off',
		// TODO: Enable
		'@typescript-eslint/no-non-null-assertion': 'off',
		// TODO: Enable, might need tweaks
		'@typescript-eslint/ban-types': 'off',
		// TODO: Enable
		'@typescript-eslint/no-empty-function': 'off',
		// TODO: Consider?
		'@typescript-eslint/ban-ts-comment': 'off',
		// TODO: Hmm??
		'@typescript-eslint/no-this-alias': 'off',
		// #endregion
	},

	overrides: [
		{
			files: ['**/*.ts?(x)'],
			// Empty override so --ext doesn't need to be passed on the CLI - eslint will
			// include anything matching overrides
		},
		// Test files
		{
			files: ['**/*.test.js', '**/__tests__/*.js'],
			env: {jest: true},
		},
	],
}
