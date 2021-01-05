module.exports = {
	root: true,
	// TODO: Might need to use both babel-eslint and typescript-eslint depending on filetype?
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],

	overrides: [
		{
			files: ['**/*.ts?(x)'],
			// Empty override so --ext doesn't need to be passed on the CLI - eslint will
			// include anything matching overrides
		},
	],
}
