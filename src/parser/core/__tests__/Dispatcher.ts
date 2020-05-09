import {Dispatcher, EventHook, TimestampHook} from '../Dispatcher'
import {DeathEvent} from 'fflogs'

/* tslint:disable:no-magic-numbers */
// TODO: This file should be using @ts-expect-error, not @ts-ignore, once TS3.9 drops

const event: DeathEvent = {
	timestamp: 50,
	type: 'death',
	sourceIsFriendly: false,
	targetIsFriendly: false,

	targetID: 0xDEADBEEF,
}

describe('Dispatcher', () => {
	let dispatcher: Dispatcher
	let callback: jest.Mock
	let eventHook: EventHook<DeathEvent>
	let timestampHook: TimestampHook

	beforeEach(() => {
		dispatcher = new Dispatcher()
		callback = jest.fn()
		eventHook = {
			event: event.type,
			module: 'test',
			callback,
		}
		timestampHook = {
			timestamp: 0,
			module: 'test',
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
		// @ts-ignore
		dispatcher.addEventHook({...eventHook, event: '__unused'})

		dispatcher.dispatch(event, ['test'])

		expect(callback).not.toHaveBeenCalled()
	})

	it('can filter by event keys', () => {
		dispatcher.addEventHook(eventHook)
		dispatcher.addEventHook({...eventHook, filter: {targetID: event.targetID}})
		dispatcher.addEventHook({...eventHook, filter: {targetID: 0xF00}})

		dispatcher.dispatch(event, ['test'])

		expect(callback).toHaveBeenCalledTimes(2)
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

	it('reports errors from event hooks', () => {
		const error = new Error('test error')
		dispatcher.addEventHook({
			...eventHook,
			callback: () => { throw error },
		})

		const errors = dispatcher.dispatch(event, ['test'])

		expect(errors).toMatchObject({test: error})
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
			callback: () => { throw error},
		})

		const errors = dispatcher.dispatch(event, ['test'])

		expect(errors).toMatchObject({test: error})
	})

	it('does not trigger timestamp hooks from unspecified modules', () => {
		dispatcher.addTimestampHook(timestampHook)
		dispatcher.dispatch(event, [])
		expect(callback).not.toHaveBeenCalled()
	})
})
