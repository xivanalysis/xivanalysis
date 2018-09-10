/**
 * @fileoverview Modules should not depend on other modules that they are not using.
 * @author ackwell
 */
'use strict'

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
	meta: {
		docs: {
			description: 'Modules should not depend on other modules that they are not using.',
			category: 'xivanalysis',
			recommended: false,
		},
		fixable: null, // or "code" or "whitespace"
		schema: [],
	},

	create: function(context) {
		// Used during parsing to keep track of state
		let dependencies = null
		let usedClassProps = null

		return {
			// As we enter a class, clear out the state
			ClassBody: () => {
				dependencies = new Set()
				usedClassProps = new Set()
			},

			// Find the dependencies prop if it exists
			ClassProperty: node => {
				// Only care about static dependencies
				if (!node.static || node.key.name !== 'dependencies') { return }

				// Value is an ArrayExpression, grab all the Literal elements from it
				node.value.elements.forEach(elem => {
					if (elem.type !== 'Literal') { return }
					dependencies.add(elem)
				})
			},

			// Deps are exposed as `this.<handle>`, track all member access on `this`
			MemberExpression: node => {
				if (node.object.type !== 'ThisExpression') {
					return
				}
				usedClassProps.add(node.property.name)
			},

			// As we exit the class body, compare deps to what was used
			'ClassBody:exit': () => {
				dependencies.forEach(dep => {
					if (!usedClassProps.has(dep.value)) {
						context.report(dep, `Dependency '${dep.value}' is unused`)
					}
				})
			},
		}
	},
}
