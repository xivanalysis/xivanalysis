module.exports = {
	env: {
		es6: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:react/recommended',
	],
	parser: 'babel-eslint',
	parserOptions: {
		ecmaFeatures: {
			experimentalObjectRestSpread: true,
			jsx: true,
		},
		sourceType: 'module',
	},
	plugins: [
		'babel',
		'react',
		'xivanalysis',
	],
	rules: {
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
		'no-case-declarations': 'off',
		'no-console': 'off',
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
		'babel/quotes': ['error', 'single'],
		'yoda': ['error', 'never', {exceptRange: true}],
		'react/no-unescaped-entities': ['error', {forbid: ['>', '}']}],
		'xivanalysis/no-unused-dependencies': 'error',
	},
	globals: {
		process: true,
	},
	overrides: [{
		files: ['**/*.test.js'],
		env: {jest: true},
		plugins: ['jest'],
		rules: {
			'jest/no-disabled-tests': 'warn',
			'jest/no-focused-tests': 'error',
			'jest/no-identical-title': 'error',
			'jest/prefer-to-have-length': 'warn',
			'jest/valid-expect': 'error',
		},
	}, {
		// Data files have a lot of magic numbers
		files: ['src/data/**/*.js'],
		rules: {
			'no-magic-numbers': 'off',
		},
	}],
}
