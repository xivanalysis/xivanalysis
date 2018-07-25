module.exports = {
	env: {
		browser: true,
		es6: true
	},
	extends: [
		'eslint:recommended',
		'plugin:react/recommended'
	],
	parser: 'babel-eslint',
	parserOptions: {
		ecmaFeatures: {
			experimentalObjectRestSpread: true,
			jsx: true
		},
		sourceType: 'module'
	},
	plugins: [
		'react'
	],
	rules: {
		'array-bracket-spacing': 'warn',
		'block-spacing': 'warn',
		'brace-style': ['error', '1tbs', {allowSingleLine: true}],
		'comma-dangle': ['warn', 'always-multiline'],
		'comma-spacing': 'warn',
		'computed-property-spacing': 'warn',
		'curly': ['error', 'all'],
		'default-case': 'off',
		'eol-last': 'error',
		'eqeqeq': ['error', 'smart'],
		'indent': ['error', 'tab'],
		'jsx-quotes': 'warn',
		'key-spacing': ['warn', {mode: 'minimum'}],
		'keyword-spacing': 'warn',
		'linebreak-style': ['error', 'unix'],
		'new-parens': 'error',
		'no-alert': 'error',
		'no-case-declarations': 'off',
		'no-console': 'off',
		'no-duplicate-imports': 'error',
		'no-else-return': ['error', {allowElseIf: false}],
		'no-lonely-if': 'error',
		'no-return-await': 'error',
		'no-trailing-spaces': 'error',
		'no-unneeded-ternary': 'error',
		'no-var': 'error',
		'object-curly-spacing': 'warn',
		'object-property-newline': ['error', {allowAllPropertiesOnSameLine: true}],
		'prefer-arrow-callback': 'warn',
		'prefer-const': 'warn',
		'quotes': ['error', 'single'],
		'semi': ['error', 'never'],
		'space-before-blocks': 'warn',
		'yoda': ['error', 'never', {exceptRange: true}],
		'react/no-unescaped-entities': ['error', {forbid: ['>', '}']}],
	},
	globals: {
		process: true
	},
	overrides: [{
		files: ['**/*.test.js'],
		env: {jest: true},
		plugins: ['jest'],
		rules: {
			"jest/no-disabled-tests": "warn",
			"jest/no-focused-tests": "error",
			"jest/no-identical-title": "error",
			"jest/prefer-to-have-length": "warn",
			"jest/valid-expect": "error"
		}
	}]
};
