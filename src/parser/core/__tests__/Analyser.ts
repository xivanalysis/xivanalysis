import {Event} from 'event'
import {Analyser} from '../Analyser'
import {EventHook, TimestampHook} from '../Dispatcher'
import Parser from '../Parser'

/* eslint-disable @xivanalysis/no-unused-dependencies */

describe('Analyser', () => {
	let parser: Parser

	beforeEach(() => {
		const MockParser = jest.fn(() => {
			const parser: Parser = ({
				dispatcher: {
					addEventHook: jest.fn(),
					removeEventHook: jest.fn(),
					addTimestampHook: jest.fn(),
					removeTimestampHook: jest.fn(),
				},
			}) as unknown as Parser
			parser.container = {
				analyser: new Analyser(parser),
			}
			return parser
		})
		parser = new MockParser()
	})

	describe('event hooks', () => {
		it('adds event hooks to the dispatcher', () => {
			const predicate = (event: Event): event is Event => true
			const callback = () => { /* noop */ }

			class TestAnalyser extends Analyser {
				static override handle = 'test'
				test() { this.addEventHook(predicate, callback) }
			}

			const analyser = new TestAnalyser(parser)
			analyser.test()

			expect(parser.dispatcher.addEventHook).toHaveBeenLastCalledWith({
				handle: 'test',
				predicate,
				callback: expect.any(Function),
			})
		})

		it('removes event hooks from the dispatcher', () => {
			const predicate = (event: Event): event is Event => true
			const callback = () => { /* noop */ }
			let hook: EventHook<Event>

			class TestAnalyser extends Analyser {
				static override handle = 'test'
				add() { hook = this.addEventHook(predicate, callback) }
				remove() { this.removeEventHook(hook) }
			}

			const analyser = new TestAnalyser(parser)
			analyser.add()
			analyser.remove()

			expect(parser.dispatcher.removeEventHook).toHaveBeenLastCalledWith({
				handle: 'test',
				predicate,
				callback: expect.any(Function),
			})
		})

		it('builds event filter predicates', () => {
			const callback = () => { /* noop */ }

			class TestAnalyser extends Analyser {
				static override handle = 'test'
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

	describe('timestamp hooks', () => {
		it('adds timestamp hooks to the dispatcher', () => {
			const timestamp = 50
			const callback = () => { /* noop */ }

			class TestAnalyser extends Analyser {
				static override handle = 'test'
				test() { this.addTimestampHook(timestamp, callback) }
			}

			const analyser = new TestAnalyser(parser)
			analyser.test()

			expect(parser.dispatcher.addTimestampHook).toHaveBeenLastCalledWith({
				handle: 'test',
				timestamp,
				callback: expect.any(Function),
			})
		})

		it('removes event hooks from the dispatcher', () => {
			const timestamp = 50
			const callback = () => { /* noop */ }
			let hook: TimestampHook

			class TestAnalyser extends Analyser {
				static override handle = 'test'
				add() { hook = this.addTimestampHook(timestamp, callback) }
				remove() { this.removeTimestampHook(hook) }
			}

			const analyser = new TestAnalyser(parser)
			analyser.add()
			analyser.remove()

			expect(parser.dispatcher.removeTimestampHook).toHaveBeenLastCalledWith({
				handle: 'test',
				timestamp,
				callback: expect.any(Function),
			})
		})
	})
})
