import Module from './Module'
import Parser from './Parser'
import {Meta} from './Meta'

/* eslint-disable no-magic-numbers */

class TestModule extends Module {
	static handle = 'test'
}

let parser
let module
let hook

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
		const meta = new Meta({
			modules: () => Promise.resolve({default: [TestModule]}),
		})
		parser = new Parser({meta, report, fight, actor: player})
		await parser.configure()
		module = parser.modules.test

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
		module.addEventHook('all', hook)
		module.triggerEvent(event)
		expect(hook)
			.toHaveBeenCalledTimes(1)
			.toHaveBeenCalledWith(event)
	})

	it('can hook a single event type', () => {
		module.addEventHook(event.type, hook)
		module.triggerEvent(event)
		expect(hook).toHaveBeenCalledTimes(1)
	})

	it('can hook multiple event types', () => {
		module.addEventHook([event.type, '__unused'], hook)
		module.triggerEvent(event)
		expect(hook).toHaveBeenCalledTimes(1)
	})

	it('does not trigger non-matching hooks', () => {
		module.addEventHook('__unused', hook)
		module.triggerEvent(event)
		expect(hook).not.toHaveBeenCalled()
	})

	it('does not trigger \'all\' hooks on symbols', () => {
		const type = Symbol('test')
		const symbolEvent = {...event, type}
		module.addEventHook('all', hook)
		module.addEventHook(type, hook)
		module.triggerEvent(symbolEvent)
		expect(hook).toHaveBeenCalledTimes(1)
	})

	it('can filter by event keys', () => {
		module.addEventHook(event.type, hook)
		module.addEventHook(event.type, {filterKey: event.filterKey}, hook)
		module.addEventHook(event.type, {filterKey: 'incorrect'}, hook)
		module.triggerEvent(event)
		expect(hook).toHaveBeenCalledTimes(2)
	})

	describe('QoL filter helpers', () => {
		it('player', () => {
			const playerEvent = {...event, sourceID: player.id}
			module.addEventHook(playerEvent.type, {by: 'player'}, hook)
			module.triggerEvent(playerEvent)
			expect(hook).toHaveBeenCalledTimes(1)
		})

		it('pet', () => {
			const petEvent = {...event, targetID: pet.id}
			module.addEventHook(petEvent.type, {to: 'pet'}, hook)
			module.triggerEvent(petEvent)
			expect(hook).toHaveBeenCalledTimes(1)
		})

		it('abilityId', () => {
			const abilityEvent = {...event, ability: {guid: 1}}
			module.addEventHook(abilityEvent.type, {abilityId: abilityEvent.ability.guid}, hook)
			module.triggerEvent(abilityEvent)
			expect(hook).toHaveBeenCalledTimes(1)
		})
	})

	it('can remove event hooks', () => {
		const hookRef = module.addEventHook(event.type, hook)
		module.triggerEvent(event)
		module.removeEventHook(hookRef)
		module.triggerEvent(event)
		expect(hook).toHaveBeenCalledTimes(1)
	})

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
