import {Injectable} from './Injectable'
import Module from './Module'
import Parser from './Parser'

export class Analyser extends Injectable {
	constructor(parser: Parser) {
		super({container: parser.container})

		// Due to dispatch order, analysers must _never_ depend on modules, but the
		// reverse is fine. Throw if any illegal dependencies are found.
		const analyser = this.constructor as typeof Analyser
		const illegalDependencies = analyser.dependencies
			.map(dependency => typeof dependency === 'string' ? dependency : dependency.handle)
			.filter(handle => parser.container[handle] instanceof Module)
		if (illegalDependencies.length > 0) {
			throw new Error(`Analyzers must never depend on legacy modules. Illegal dependencies found on ${analyser.handle}: ${illegalDependencies.join(', ')}.`)
		}
	}

	/**
	 * Called when the analyser has been successfully instantiated and configured,
	 * before any analysis is run. This is the recommended location to configure hooks.
	 */
	initialise() {}
}
