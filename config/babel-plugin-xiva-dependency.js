/*
Babel plugin to preserve compat with TS-style decorators for xiva's
dependency system. Effectively turns declarations like:
```
@dependency private someModule!: SomeModule
```
into
```
@dependency
@dependency.type(SomeModule)
private someModule: SomeModule = this.someModule
```
which will then be further processed by other presets.
*/

module.exports = function({
	assertVersion,
	types: t,
}) {
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	assertVersion(7)

	function toMemberExpression(identifierPath) {
		// If this is an identifier leaf, clone the node and halt
		if (identifierPath.isIdentifier()) {
			return t.cloneDeep(identifierPath.node)
		}

		// Otherwise, ensure it's a qualified ident & recurse
		identifierPath.assertTSQualifiedName()
		return t.memberExpression(
			toMemberExpression(identifierPath.get('left')),
			t.cloneDeep(identifierPath.get('right').node),
		)
	}

	function visitDecorator(path) {
		// Make sure we only operate on `@dependency`
		const expression = path.get('expression').getSource()
		if (expression !== 'dependency') { return }

		// If it's been used on something other than a class property, throw
		const propertyPath = path.parentPath
		if (!propertyPath.isClassProperty()) {
			throw propertyPath.buildCodeFrameError('`@dependency` may only be used on class properties.')
		}

		// Make sure there's no value - we're adding our own
		const valuePath = propertyPath.get('value')
		if (valuePath.node != null) {
			throw valuePath.buildCodeFrameError('Properties decorated with `@dependency` must have no initial value.')
		}

		// Get the type annotation as a member expression, falling back to `Object` if there's nothing (i.e. JS)
		const annotationPath = propertyPath.get('typeAnnotation')
		const designTypeExpression = annotationPath.node != null
			? toMemberExpression(annotationPath.get('typeAnnotation').get('typeName'))
			: t.identifier('Object')

		// Push a dependency.type call into the decorators, with the design type as an argument
		propertyPath.pushContainer(
			'decorators',
			t.decorator(
				t.callExpression(
					t.memberExpression(t.identifier('dependency'), t.identifier('type')),
					[designTypeExpression]
				)
			),
		)

		// Replace the property value with a reference to itself. This effectively generates
		// `value = this.value`, working around ES spec's enforced assignment to undefined.
		valuePath.replaceWith(
			t.memberExpression(
				t.thisExpression(),
				t.cloneDeep(propertyPath.get('key').node),
			)
		)

		// A lot of dependencies are marked as definite, remove that so the TS babel
		// pass doesn't throw errors at us.
		propertyPath.node.definite = false
	}

	function visitClassDeclaration(path) {
		// Find all the decorators on the class & visit them
		path.get('body').get('body')
			.flatMap(path => path.get('decorators'))
			.filter(path => path.node != null)
			.forEach(visitDecorator)

		// Recrawl the scope so any changes we've made are flagged correctly
		path.parentPath.scope.crawl()
	}

	return {
		visitor: {
			// Visiting from the program level to ensure we execute before other full-file
			// transforms, such as typescript, are executed.
			Program(programPath) {
				programPath.traverse({
					ClassDeclaration: visitClassDeclaration,
				})
			},
		},
	}
}
