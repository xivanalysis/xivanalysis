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
		'indent': ['error', 'tab'],
		'linebreak-style': ['error', 'unix'],
		'quotes': ['error', 'single'],
		'semi': ['error', 'never']
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
