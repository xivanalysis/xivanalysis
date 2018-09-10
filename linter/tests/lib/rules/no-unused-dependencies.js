/**
 * @fileoverview Modules should not depend on other modules that they are not using.
 * @author ackwell
 */
'use strict'

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const RuleTester = require('eslint').RuleTester
const rule = require('../../../lib/rules/no-unused-dependencies')

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

RuleTester.setDefaultConfig({
	parser: 'babel-eslint',
	parserOptions: {
		ecmaVersion: 6,
		sourceType: 'module',
	},
})

const ruleTester = new RuleTester()
ruleTester.run('no-unused-dependencies', rule, {
	valid: [
		`
import Module from 'parser/core/module'

export default class Something extends Module {
	static handle = 'something'
	static dependencies = [
		...Module.dependencies,
		'somethingElse',
	]
	constructor(...args) {
		super(...args)
		this.somethingElse.use()
	}
}
		`,
	],

	invalid: [
		{
			code: `
import Module from 'parser/core/module'

export default class Something extends Module {
	static handle = 'something'
	static dependencies = [
		...Module.dependencies,
		'unused',
		'somethingElse',
	]
	constructor(...args) {
		super(...args)
		this.somethingElse.use()
	}
}
			`,
			errors: [{
				message: 'Dependency \'unused\' is unused',
				type: 'Literal',
			}],
		},
	],
})
