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

	it('adds timestamp hooks to the dispatcher', () => {
		const timestamp = 50
		module.addTimestampHook(timestamp, hook)

		expect(dispatcher.addTimestampHook).toHaveBeenCalledTimes(1)
		expect(dispatcher.addTimestampHook.mock.calls[0][0]).toMatchObject({
			module: module.constructor.handle,
			timestamp,
		})
	})

	it('removes timestamp hooks from the dispatcher', () => {
		const hookRef = module.addTimestampHook(50, hook)
		module.removeTimestampHook(hookRef)

		expect(dispatcher.removeTimestampHook)
			.toHaveBeenCalledTimes(1)
			.toHaveBeenCalledWith(hookRef)
	})
})
