import pluginJs from '@eslint/js'
import * as pluginImport from 'eslint-plugin-import'
import pluginJest from 'eslint-plugin-jest'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import pluginTs from 'typescript-eslint'

// eslint-disable-next-line import/no-default-export
export default pluginTs.config(
	{ignores: ["./build", './locale']},
	pluginJs.configs.recommended,
	pluginTs.configs.recommended,
	pluginReact.configs.flat.recommended,
	pluginReact.configs.flat['jsx-runtime'],
	pluginImport.flatConfigs.errors,
	pluginImport.flatConfigs.typescript,
	{
		languageOptions: {
			parserOptions: {
				tsconfigRootDir: import.meta.dirname,
				project: [
					'./tsconfig.json',
					'./tsconfig.tooling.json',
				],
			},

			ecmaVersion: 5,
			sourceType: 'module',

			globals: {
				...globals.browser,
				...globals.commonjs,
				process: true,
			},
		},

		plugins: {
			'react-hooks': pluginReactHooks,
		},

		settings: {
			react: {
				version: 'detect',
			},
			'import/resolver': {
				typescript: {
					alwaysTryTypes: true,
				},
			},
		},

		rules: {
			...pluginReactHooks.configs.recommended.rules,

			// Disabled recommended rules
			'default-case': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-inferrable-types': 'off',

			// Primary shared rules
			'array-bracket-spacing': 'warn',
			'@typescript-eslint/array-type': ['error', {default: 'array-simple'}],
			'block-spacing': 'warn',
			'brace-style': ['error', '1tbs', {allowSingleLine: true}],
			'comma-dangle': ['error', 'always-multiline'],
			'comma-spacing': 'warn',
			'comma-style': 'warn',
			'computed-property-spacing': 'warn',
			'curly': ['error', 'all'],
			'@typescript-eslint/dot-notation': ['error', {
				allowPrivateClassPropertyAccess: true,
				allowProtectedClassPropertyAccess: true,
			}],
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
			'no-console': ['error', {allow: ['warn', 'error']}],
			'no-duplicate-imports': 'error',
			'no-else-return': ['error', {allowElseIf: false}],
			'no-implicit-globals': 'error',
			'no-lonely-if': 'error',
			'@typescript-eslint/no-magic-numbers': ['warn', {
				ignoreArrayIndexes: true,
				ignoreDefaultValues: true,
				ignoreEnums: true,
				ignoreReadonlyClassProperties: true,
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
			'@typescript-eslint/no-unused-vars': ['error', {
				argsIgnorePattern: '^_',
				caughtErrorsIgnorePattern: '^_',
				ignoreRestSiblings: true,
			}],
			'no-useless-rename': 'error',
			'no-var': 'error',
			'no-whitespace-before-property': 'warn',
			'object-curly-spacing': 'warn',
			'object-property-newline': ['error', {allowAllPropertiesOnSameLine: true}],
			'prefer-arrow-callback': ['error', {allowNamedFunctions: true}],
			'prefer-const': 'warn',
			'prefer-spread': 'error',
			'semi': ['error', 'never'],
			'space-before-blocks': 'warn',
			'space-in-parens': 'warn',
			'template-curly-spacing': ['warn', 'never'],
			// '@typescript-eslint/quotes': ['error', 'single', {avoidEscape: true}],
			'yoda': ['error', 'never', {exceptRange: true}],

			// Imports
			'import/first': 'error',
			'import/order': ['error', {
				groups: [
					// Pull non-relative imports above relative
					['builtin', 'external', 'internal', 'unknown', 'index', 'object', 'type'],
				],
				'newlines-between': 'never',
				alphabetize: {order: 'asc', caseInsensitive: true},
			}],
			'import/no-default-export': 'error',

			// React-specific rules
			'react/display-name': 'off',
			'react/no-unescaped-entities': ['error', {forbid: ['>', '}']}],
			'react/no-children-prop': 'off',
		},
	},
	// Test files
	{
		files: ['**/*.test.js', '**/__tests__/*.js'],
		plugins: {
			jest: pluginJest,
		},
		languageOptions: {
			globals: pluginJest.environments.globals.globals,
		},
		rules: {
			'jest/no-disabled-tests': 'warn',
			'jest/no-focused-tests': 'error',
			'jest/no-identical-title': 'error',
			'jest/prefer-to-have-length': 'warn',
			'jest/valid-expect': 'error',
		},
	},
	// Data files
	{
		files: ['src/data/**/*.[tj]s?(x)'],
		rules: {
			// Data inherently contains a lot of magic numbers
			'@typescript-eslint/no-magic-numbers': 'off',
		},
	},
)
