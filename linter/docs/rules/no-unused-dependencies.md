# Modules should not depend on other modules that they are not using. (no-unused-dependencies)

## Rule Details

Modules can depend on others, even if they're not being used. Doing so adds extra edges to the module graph, which can cause inflexibility down the line. Only depend on modules that you're actually using.

Examples of **incorrect** code for this rule:

```js
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
```

Examples of **correct** code for this rule:

```js
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
```
