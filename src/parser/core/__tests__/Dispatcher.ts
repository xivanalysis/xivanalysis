import {Event, Events} from 'event'
import {DispatcherImpl, EventHook, TimestampHook} from '../Dispatcher'

/* eslint-disable @typescript-eslint/no-magic-numbers */

const event: Events['action'] = {
	type: 'action',
	timestamp: 50,
	source: 'source',
	target: 'target',
	action: 0,
}

describe('Dispatcher', () => {
	let dispatcher: DispatcherImpl
	let callback: jest.Mock
	let eventHook: EventHook<Events['action']>
	let timestampHook: TimestampHook

	beforeEach(() => {
		dispatcher = new DispatcherImpl()
		callback = jest.fn()
		eventHook = {
			predicate: (event: Event): event is Events['action'] => true,
			handle: 'test',
			callback,
		}
		timestampHook = {
			timestamp: 0,
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
			predicate: (event: Event): event is Events['action'] => false,
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

	it('can hook a timestamp', () => {
		dispatcher.addTimestampHook({...timestampHook, timestamp: 50})

		dispatcher.dispatch({...event, timestamp: 1}, ['test'])
		expect(callback).not.toHaveBeenCalled()

		dispatcher.dispatch({...event, timestamp: 100}, ['test'])
		expect(callback).toHaveBeenCalledTimes(1)
	})

	it('will catch up on multiple timestamp hooks in a single event', () => {
		dispatcher.addTimestampHook({...timestampHook, timestamp: 40})
		dispatcher.addTimestampHook({...timestampHook, timestamp: 50})
		dispatcher.addTimestampHook({...timestampHook, timestamp: 60})

		dispatcher.dispatch({...event, timestamp: 100}, ['test'])

		expect(callback).toHaveBeenCalledTimes(3)
		expect(callback).toHaveBeenNthCalledWith(3, {timestamp: 60})
	})

	it('does not trigger hooks added to the past', () => {
		dispatcher.dispatch({...event, timestamp: 100}, ['test'])
		dispatcher.addTimestampHook({...timestampHook, timestamp: 50})
		dispatcher.dispatch({...event, timestamp: 200}, ['test'])

		expect(callback).not.toHaveBeenCalled()
	})

	it('reports the correct timestamp during timestamp hook callback execution', () => {
		let timestamp: number | undefined

		dispatcher.addTimestampHook({
			...timestampHook,
			callback: () => timestamp = dispatcher.timestamp,
		})
		dispatcher.dispatch(event, ['test'])

		expect(timestamp).toBe(timestampHook.timestamp)
	})

	it('can remove timestamp hooks', () => {
		dispatcher.addTimestampHook(timestampHook)
		dispatcher.removeTimestampHook(timestampHook)

		dispatcher.dispatch({...event, timestamp: 100}, ['test'])

		expect(callback).not.toHaveBeenCalled()
	})

	it('reports errors from timestamp hooks', () => {
		const error = new Error('test error')
		dispatcher.addTimestampHook({
			...timestampHook,
			callback: () => { throw error },
		})

		const issues = dispatcher.dispatch(event, ['test'])

		expect(issues).toIncludeSameMembers([{error, handle: 'test'}])
	})

	it('does not trigger timestamp hooks from unspecified modules', () => {
		dispatcher.addTimestampHook(timestampHook)
		dispatcher.dispatch(event, [])
		expect(callback).not.toHaveBeenCalled()
	})
})
