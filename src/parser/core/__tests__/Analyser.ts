import {Event} from 'event'
import {Analyser} from '../Analyser'
import {EventHook} from '../Dispatcher'
import Module from '../Module'
import Parser from '../Parser'

describe('Analyser', () => {
	let parser: Parser

	beforeEach(() => {
		const MockParser = jest.fn(() => {
			const parser: Parser = ({
				dispatcher: {
					addEventHook: jest.fn(),
					removeEventHook: jest.fn(),
				},
			}) as unknown as Parser
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
			static handle = 'throwing'
			static dependencies = ['analyser', 'module']
		}

		expect(() => new ThrowingAnalyser(parser))
			.toThrow('Illegal dependencies found on throwing: module')
	})

	describe('event hooks', () => {
		it('registers event hooks with the dispatcher', () => {
			const predicate = (event: Event): event is Event => true
			const callback = () => {}

			class TestAnalyser extends Analyser {
				static handle = 'test'
				test() { this.addEventHook(predicate, callback) }
			}

			const analyser = new TestAnalyser(parser)
			analyser.test()

			expect(parser.dispatcher.addEventHook).toHaveBeenLastCalledWith({
				handle: 'test',
				predicate,
				callback,
			})
		})

		it('removes event hooks from the dispatcher', () => {
			const predicate = (event: Event): event is Event => true
			const callback = () => {}
			let hook: EventHook<Event>

			class TestAnalyser extends Analyser {
				static handle = 'test'
				add() { hook = this.addEventHook(predicate, callback) }
				remove() { this.removeEventHook(hook) }
			}

			const analyser = new TestAnalyser(parser)
			analyser.add()
			analyser.remove()

			expect(parser.dispatcher.removeEventHook).toHaveBeenLastCalledWith({
				handle: 'test',
				predicate,
				callback,
			})
		})

		it('builds event filter predicates', () => {
			const callback = () => {}

			class TestAnalyser extends Analyser {
				static handle = 'test'
				stringType() { this.addEventHook('action', callback) }
				partialEvent() { this.addEventHook({type: 'action'}, callback) }
			}
			const analyser = new TestAnalyser(parser)

			const addEventHook = parser.dispatcher.addEventHook as jest.Mock

			analyser.stringType()
			const stringTypePredicate = addEventHook.mock.calls[0][0].predicate

			expect(stringTypePredicate({type: 'action'})).toBeTrue()
			expect(stringTypePredicate({type: 'prepare'})).toBeFalse()

			analyser.partialEvent()
			const partialEventPredicate = addEventHook.mock.calls[1][0].predicate

			expect(partialEventPredicate({type: 'action'})).toBeTrue()
			expect(partialEventPredicate({type: 'prepare'})).toBeFalse()
		})
	})
})
