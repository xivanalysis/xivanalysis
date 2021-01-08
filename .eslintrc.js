module.exports = {
	root: true,
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:react/recommended',
	],

	// TODO: Might need to use both babel-eslint and typescript-eslint depending on filetype?
	parser: '@typescript-eslint/parser',
	plugins: [
		'@typescript-eslint',
		'react',
		'react-hooks',
		// TODO: Remove this, bring rule into xiva/xiva repo.
		'@xivanalysis',
	],

	settings: {
		react: {version: 'detect'},
	},

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
		// TODO: Enable?
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
		// TODO: ts-eslint docs recc. turning this off. probably enable for js only?
		'no-undef': 'off',
		// TODO: Enable for at least .log (debug exists)
		'no-console': 'off',
		// TODO: Enable at _minimum_ {default: 'array-simple'}
		'@typescript-eslint/array-type': 'off',
		// #endregion

		'array-bracket-spacing': 'warn',
		'block-spacing': 'warn',
		'brace-style': ['error', '1tbs', {allowSingleLine: true}],
		'comma-dangle': ['error', 'always-multiline'],
		'comma-spacing': 'warn',
		'comma-style': 'warn',
		'computed-property-spacing': 'warn',
		'curly': ['error', 'all'],
		'default-case': 'off',
		'dot-notation': 'error',
		'eol-last': 'error',
		'eqeqeq': ['error', 'smart'],
		'func-call-spacing': 'warn',
		'indent': ['error', 'tab'],
		'jsx-quotes': 'error',
		'key-spacing': ['warn', {mode: 'minimum'}],
		'keyword-spacing': 'warn',
		'linebreak-style': ['error', 'unix'],
		'newline-per-chained-call': ['warn', {ignoreChainWithDepth: 3}],
		'new-parens': 'error',
		'no-alert': 'error',
		'no-duplicate-imports': 'error',
		'no-else-return': ['error', {allowElseIf: false}],
		'no-implicit-globals': 'error',
		'no-lonely-if': 'error',
		'no-magic-numbers': ['warn', {
			ignoreArrayIndexes: true,
			ignore: [
				-1,   // Used by a lot of stuff (inc stdlib) to represent not found
				0,    // I prefer .length===0 checks most of the time
				1,    // THE NUMBER ONE
				2,    // Often used for number formatting and similar
				100,  // Percents
				1000, // Lots of translation between s and ms
			],
		}],
		'no-multiple-empty-lines': ['warn', {max: 1, maxBOF: 0, maxEOF: 1}],
		'no-return-await': 'error',
		'no-trailing-spaces': 'error',
		'no-unneeded-ternary': 'error',
		'no-useless-rename': 'error',
		'no-var': 'error',
		'no-whitespace-before-property': 'warn',
		'object-curly-spacing': 'warn',
		'object-property-newline': ['error', {allowAllPropertiesOnSameLine: true}],
		'prefer-arrow-callback': 'error',
		'prefer-const': 'warn',
		'prefer-spread': 'error',
		'semi': ['error', 'never'],
		'space-before-blocks': 'warn',
		'space-in-parens': 'warn',
		'template-curly-spacing': ['warn', 'never'],
		'@typescript-eslint/quotes': ['error', 'single', {avoidEscape: true}],
		'yoda': ['error', 'never', {exceptRange: true}],

		'react/display-name': 'off',
		'react/no-unescaped-entities': ['error', {forbid: ['>', '}']}],
		'react/no-children-prop': 'off',
		'react-hooks/rules-of-hooks': 'error',
		'react-hooks/exhaustive-deps': 'warn',

		'@xivanalysis/no-unused-dependencies': 'error',
	},

	overrides: [
		{
			files: ['**/*.ts?(x)'],
			// Empty override so --ext doesn't need to be passed on the CLI - eslint will
			// include anything matching overrides

			// TODO: Reevaluate and remove these. These disables are simply to get the build green
			// for the primary tooling PR, and stem from rule mismatch and poor tooling with the
			// previous tslint harness.
			rules: {
				'no-magic-numbers': 'off',
				// TODO: Sometimes we want a fn callback in react for displayname purposes. Consider for JS, too.
				'prefer-arrow-callback': 'off',
			},
		},
		// Test files
		{
			files: ['**/*.test.js', '**/__tests__/*.js'],
			env: {jest: true},
			plugins: ['jest'],
			rules: {
				'jest/no-disabled-tests': 'warn',
				'jest/no-focused-tests': 'error',
				'jest/no-identical-title': 'error',
				'jest/prefer-to-have-length': 'warn',
				'jest/valid-expect': 'error',
			},
		},
	],
}
