import {Injectable} from './Injectable'
import Module from './Module'
import Parser from './Parser'

export class Analyser extends Injectable {
	constructor(parser: Parser) {
		super({container: parser.container})

		// Due to dispatch order, analysers must _never_ depend on modules, but the
		// reverse is fine. Throw if any illegal dependencies are found.
		const analyzer = this.constructor as typeof Analyser
		const illegalDependencies = analyzer.dependencies
			.map(dependency => typeof dependency === 'string' ? dependency : dependency.handle)
			.filter(handle => parser.container[handle] instanceof Module)
		if (illegalDependencies.length > 0) {
			throw new Error(`Analyzers must never depend on legacy modules. Illegal dependencies found: ${illegalDependencies.join(', ')}.`)
		}
	}

	/** TODO DOCS */
	initialise() {}
}
