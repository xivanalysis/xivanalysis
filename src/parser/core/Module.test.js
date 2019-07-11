import Module from './Module'
import Parser from './Parser'
import {Meta} from './Meta'

class TestModule extends Module {
	static handle = 'test'
}

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
}

const event = {
	type: '__test',
	timestamp: 50,
	filterKey: 'example',
}

describe('Module', () => {
	beforeEach(() => {
		const meta = new Meta({modules: () => Promise.resolve([])})
		const parser = new Parser({meta, report, fight, actor: player})
		module = new TestModule(parser)

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
		module.addHook('all', hook)
		module.triggerEvent(event)
		expect(hook)
			.toHaveBeenCalledTimes(1)
			.toHaveBeenCalledWith(event)
	})

	it('can hook a single event type', () => {
		module.addHook(event.type, hook)
		module.triggerEvent(event)
		expect(hook).toHaveBeenCalledTimes(1)
	})

	it('can hook multiple event types', () => {
		module.addHook([event.type, '__unused'], hook)
		module.triggerEvent(event)
		expect(hook).toHaveBeenCalledTimes(1)
	})

	it('does not trigger non-matching hooks', () => {
		module.addHook('__unused', hook)
		module.triggerEvent(event)
		expect(hook).not.toHaveBeenCalled()
	})

	it('does not trigger \'all\' hooks on symbols', () => {
		const type = Symbol('test')
		const symbolEvent = {...event, type}
		module.addHook('all', hook)
		module.addHook(type, hook)
		module.triggerEvent(symbolEvent)
		expect(hook).toHaveBeenCalledTimes(1)
	})

	it('can filter by event keys', () => {
		module.addHook(event.type, hook)
		module.addHook(event.type, {filterKey: event.filterKey}, hook)
		module.addHook(event.type, {filterKey: 'incorrect'}, hook)
		module.triggerEvent(event)
		expect(hook).toHaveBeenCalledTimes(2)
	})

	describe('QoL filter helpers', () => {
		it('player', () => {
			const playerEvent = {...event, sourceID: player.id}
			module.addHook(playerEvent.type, {by: 'player'}, hook)
			module.triggerEvent(playerEvent)
			expect(hook).toHaveBeenCalledTimes(1)
		})

		it('pet', () => {
			const petEvent = {...event, targetID: pet.id}
			module.addHook(petEvent.type, {to: 'pet'}, hook)
			module.triggerEvent(petEvent)
			expect(hook).toHaveBeenCalledTimes(1)
		})

		it('abilityId', () => {
			const abilityEvent = {...event, ability: {guid: 1}}
			module.addHook(abilityEvent.type, {abilityId: abilityEvent.ability.guid}, hook)
			module.triggerEvent(abilityEvent)
			expect(hook).toHaveBeenCalledTimes(1)
		})
	})

	it('can remove hooks', () => {
		const hookRef = module.addHook(event.type, hook)
		module.triggerEvent(event)
		module.removeHook(hookRef)
		module.triggerEvent(event)
		expect(hook).toHaveBeenCalledTimes(1)
	})
})
