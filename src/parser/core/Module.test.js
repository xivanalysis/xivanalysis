import Module from './Module'
import Parser from './Parser'
import {Meta} from './Meta'
import {Dispatcher} from './Dispatcher'

jest.mock('./Dispatcher')

/* eslint-disable no-magic-numbers */

class TestModule extends Module {
	static handle = 'test'
}

let parser
let module
let hook

let dispatcher

// Testing data
const player = {
	id: 1,
}
const pet = {
	id: 2,
	petOwner: player.id,
}
const report = {
	lang: 'en',
	start: 0,
	friendlies: [player],
	friendlyPets: [pet],
}
const fight = {
	start_time: 0,
	end_time: 100,
}

const event = {
	type: '__test',
	timestamp: 50,
	filterKey: 'example',
}

describe('Module', () => {
	beforeEach(async () => {
		Dispatcher.mockClear()

		const meta = new Meta({
			modules: () => Promise.resolve({default: [TestModule]}),
		})
		parser = new Parser({
			meta,
			report,
			fight,
			actor: player,
			dispatcher: new Dispatcher(),
		})
		await parser.configure()
		module = parser.modules.test

		dispatcher = Dispatcher.mock.instances[0]
		dispatcher.addEventHook.mockImplementation(x => x)

		hook = jest.fn()
	})

	// I'm explicitly _not_ testing the handle fallback. That should never make it to prod.

	it('falls back to generated title', () => {
		expect(module.constructor.title).toEqual('Test')
	})

	it('noop normalises by default', () => {
		const events = [event]
		const result = module.normalise(events)
		expect(result).toBe(events)
	})

	it('can hook all events', () => {
		// TODO: Remove the last all hook
		module.addEventHook('all', hook)
		module.triggerEvent(event)
		expect(hook)
			.toHaveBeenCalledTimes(1)
			.toHaveBeenCalledWith(event)
	})

	it('adds event hooks to the dispatcher', () => {
		module.addEventHook(event.type, hook)

		expect(dispatcher.addEventHook).toHaveBeenCalledTimes(1)
		expect(dispatcher.addEventHook.mock.calls[0][0]).toMatchObject({
			module: module.constructor.handle,
			filter: {},
			event: event.type,
		})
	})

	it('adds multiple event hooks to the dispatcher', () => {
		module.addEventHook([event.type, '__unused'], hook)

		expect(dispatcher.addEventHook).toHaveBeenCalledTimes(2)
		expect(dispatcher.addEventHook.mock.calls.map(params => params[0].event)).toEqual([event.type, '__unused'])
	})

	it('does not trigger \'all\' hooks on symbols', () => {
		// TODO: Remove 'all'
		const type = Symbol('test')
		const symbolEvent = {...event, type}
		module.addEventHook('all', hook)
		module.addEventHook(type, hook)
		module.triggerEvent(symbolEvent)
		expect(hook).toHaveBeenCalledTimes(1)
	})

	describe('QoL filter helpers', () => {
		it('player', () => {
			module.addEventHook(event.type, {by: 'player'}, hook)
			expect(dispatcher.addEventHook.mock.calls[0][0]).toMatchObject({
				filter: {sourceID: player.id},
			})
		})

		it('pet', () => {
			module.addEventHook(event.type, {to: 'pet'}, hook)
			expect(dispatcher.addEventHook.mock.calls[0][0]).toMatchObject({
				filter: {targetID: [pet.id]},
			})
		})

		it('abilityId', () => {
			const abilityId = 1
			module.addEventHook(event.type, {abilityId}, hook)
			expect(dispatcher.addEventHook.mock.calls[0][0]).toMatchObject({
				filter: {ability: {guid: abilityId}},
			})
		})
	})

	it('can remove event hooks', () => {
		const hookRefs = module.addEventHook(event.type, hook)
		module.removeEventHook(hookRefs)

		expect(dispatcher.removeEventHook)
			.toHaveBeenCalledTimes(1)
			.toHaveBeenCalledWith(hookRefs[0])
	})

	// TODO: BENEATH HERE ---

	it('can hook a timestamp', () => {
		module.addTimestampHook(50, hook)

		module.triggerEvent({...event, timestamp: 1})
		expect(hook).not.toHaveBeenCalled()

		module.triggerEvent({...event, timestamp: 100})
		expect(hook).toHaveBeenCalledTimes(1)
	})

	it('will catch up on multiple timestamp hooks in a single event', () => {
		module.addTimestampHook(40, hook)
		module.addTimestampHook(50, hook)
		module.addTimestampHook(60, hook)

		module.triggerEvent({...event, timestamp: 100})
		expect(hook)
			.toHaveBeenCalledTimes(3)
			.toHaveBeenNthCalledWith(3, {timestamp: 60})
	})

	it('can remove timestamp hooks', () => {
		const hookRef = module.addTimestampHook(50, hook)
		module.removeTimestampHook(hookRef)
		module.triggerEvent({...event, timestamp: 100})
		expect(hook).not.toHaveBeenCalled()
	})

	it('reports the correct timestamp while executing timestamp hooks', () => {
		let hookTimestamp = -1
		const testHook = () => hookTimestamp = parser.currentTimestamp
		module.addTimestampHook(50, testHook)

		parser.parseEvents([{...event, timestamp: 100}])

		expect(hookTimestamp).toBe(50)
	})
})
