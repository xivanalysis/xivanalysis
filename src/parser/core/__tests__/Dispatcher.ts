import {Event, Events} from 'event'
import {Dispatcher, EventHook} from '../Dispatcher'

const event: Events['action'] = {
	type: 'action',
	timestamp: 50,
	source: 'source',
	target: 'target',
	action: 0,
}

describe('Dispatcher', () => {
	let dispatcher: Dispatcher
	let callback: jest.Mock
	let eventHook: EventHook<Events['action']>

	beforeEach(() => {
		dispatcher = new Dispatcher()
		callback = jest.fn()
		eventHook = {
			filter: {execute: () => true},
			handle: 'test',
			callback,
		}
	})

	it('can hook an event', () => {
		dispatcher.addEventHook(eventHook)

		dispatcher.dispatch(event, ['test'])

		expect(callback).toHaveBeenCalledTimes(1)
		expect(callback).toHaveBeenCalledWith(event)
	})

	it('does not trigger non-matching hooks', () => {
		dispatcher.addEventHook({
			...eventHook,
			filter: {execute: () => false},
		})

		dispatcher.dispatch(event, ['test'])

		expect(callback).not.toHaveBeenCalled()
	})

	it('reports the event timestamp during event callback execution', () => {
		let timestamp: number | undefined

		dispatcher.addEventHook({
			...eventHook,
			callback: () => timestamp = dispatcher.timestamp,
		})
		dispatcher.dispatch(event, ['test'])

		expect(timestamp).toBe(event.timestamp)
	})

	it('can remove event hooks', () => {
		dispatcher.addEventHook(eventHook)
		dispatcher.dispatch(event, ['test'])
		dispatcher.removeEventHook(eventHook)
		dispatcher.dispatch(event, ['test'])

		expect(callback).toHaveBeenCalledTimes(1)
	})

	it('reports dispatch issues', () => {
		const error = new Error('test error')
		dispatcher.addEventHook({
			...eventHook,
			callback: () => { throw error },
		})

		const issues = dispatcher.dispatch(event, ['test'])

		expect(issues).toIncludeSameMembers([{error, handle: 'test'}])
	})

	it('does not trigger event hooks from unspecified modules', () => {
		dispatcher.addEventHook(eventHook)
		dispatcher.dispatch(event, [])
		expect(callback).not.toHaveBeenCalled()
	})
})
