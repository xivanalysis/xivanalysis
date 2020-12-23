import {Analyser} from '../Analyser'
import Parser from '../Parser'

export class NewAnalyserTest extends Analyser {
	static handle = 'newTest'

	// TODO: use initialise
	constructor(parser: Parser) {
		super(parser)

		// TODO: add api to Analyser for sugar
		parser.dispatcher.addEventHook({
			handle: 'newTest',
			filter: () => true,
			callback: () => {},
		})
	}
}
