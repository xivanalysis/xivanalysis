import {Analyser} from '../Analyser'
import Module from '../Module'
import Parser from '../Parser'

describe('Analyser', () => {
	let parser: Parser

	beforeEach(() => {
		const MockParser = jest.fn(() => {
			const parser: Parser = ({}) as unknown as Parser
			parser.container = {
				analyser: new Analyser(parser),
				module: new Module(parser),
			}
			return parser
		})
		parser = new MockParser()
})

	it('cannot depend on legacy modules', () => {
		class ThrowingAnalyser extends Analyser {
			static dependencies = ['analyser', 'module']
		}

		expect(() => new ThrowingAnalyser(parser)).toThrow('Illegal dependencies found: module')
	})
})
