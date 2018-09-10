/**
 * @fileoverview Project-specific linting rules for xivanalysis.
 * @author ackwell
 */
'use strict'

// -----
// Requirements
// -----

const requireIndex = require('requireindex')

// -----
// Plugin Definition
// -----

module.exports = {
	// import all rules in lib/rules
	rules: requireIndex(__dirname + '/rules'),
	configs: requireIndex(__dirname + '/configs'),
}

