import Module from './Module'
import Parser from './Parser'
import {Meta} from './Meta'

/* eslint-disable @xivanalysis/no-unused-dependencies, no-magic-numbers */

// Testing modules
class BasicModule extends Module {
	static handle = 'test_basic'
	normalise = jest.fn(events => events)
	triggerEvent = jest.fn()
}
class BasicThrowingModule extends BasicModule {
	triggerEvent = jest.fn((/* events */) => {
		throw new Error('Test event')
	})
}
class RenamedModule extends Module {
	static handle = 'test_renamed'
}
class RenamedThrowingModule extends RenamedModule {
	triggerEvent = jest.fn((/* events */) => {
		throw new Error('Test event')
	})
}
class DependentModule extends Module {
	static handle = 'test_dependent'
	static dependencies = [
		'test_basic',
		{handle: 'test_renamed', prop: 'renamed'},
	]
	triggerEvent = jest.fn()
}

// Bunch of basic testing data
const friendlyInFight = {
	id: 1,
	name: 'In Fight',
	fights: [{id: 1}],
}
const friendlyNotInFight = {
	id: 2,
	name: 'Not-in Fight',
	fights: [{id: 9000}],
}
const report = {
	lang: 'en',
	start: 0,
	friendlies: [friendlyInFight, friendlyNotInFight],
	friendlyPets: [],
}
const fight = {
	id: 1,
	start_time: 0,
	end_time: 100,
}
const event = {
	type: '__test',
	timestamp: 50,
}

const buildParser = (modules = []) => new Parser({
	meta: new Meta({modules: () => Promise.resolve({default: modules})}),
	report,
	fight,
	actor: friendlyInFight,
})

describe('Parser', () => {
	let parser

	beforeEach(() => {
		parser = buildParser()
	})

	it('exposes metadata', () => {
		// Just making sure that modules will have access to it
		expect(parser.report).toMatchObject(report)
		expect(parser.fight).toMatchObject(fight)
		expect(parser.player).toMatchObject(friendlyInFight)
	})

	it('starts at beginning of fight', () => {
		expect(parser.currentTimestamp).toBe(fight.start_time)
	})

	it('tracks current timestamp', () => {
		parser.parseEvents([event])
		expect(parser.currentTimestamp).toBe(event.timestamp)
		expect(parser.fightDuration).toBe(event.timestamp - fight.start_time)
	})

	it('does not exceed fight end time', () => {
		parser.parseEvents([{
			type: 'test',
			timestamp: fight.end_time + 50,
		}])
		expect(parser.currentTimestamp).toBe(fight.end_time)
		expect(parser.fightDuration).toBe(fight.end_time - fight.start_time)
	})

	it('filters to friendlies in fight', () => {
		expect(parser.fightFriendlies)
			.toContain(friendlyInFight)
			.not.toContain(friendlyNotInFight)
	})

	it('loads modules', async () => {
		parser = buildParser([BasicModule])
		await parser.configure()

		expect(parser.modules).toHaveProperty('test_basic')
		expect(parser.modules.test_basic).toBeInstanceOf(BasicModule)
	})

	it('runs normalisers', async () => {
		parser = buildParser([BasicModule])
		await parser.configure()
		parser.normalise([event])

		const mock = parser.modules.test_basic.normalise.mock
		expect(mock.calls).toHaveLength(1)
		expect(mock.calls[0][0]).toEqual([event])
	})

	it('triggers events on modules', async () => {
		parser = buildParser([BasicModule])
		await parser.configure()
		parser.parseEvents([event])

		const mock = parser.modules.test_basic.triggerEvent.mock
		expect(mock.calls).toHaveLength(3)
		expect(mock.calls[0][0]).toContainEntry(['type', 'init'])
		expect(mock.calls[1][0]).toEqual(event)
		expect(mock.calls[2][0]).toContainEntry(['type', 'complete'])
	})

	it('stops processing modules that error', async () => {
		parser = buildParser([BasicThrowingModule])
		await parser.configure()
		parser.parseEvents([event])

		const mock = parser.modules.test_basic.triggerEvent.mock
		expect(mock.calls).toHaveLength(1)
	})

	it('links dependencies', async () => {
		parser = buildParser([BasicModule, DependentModule, RenamedModule])
		await parser.configure()

		const module = parser.modules.test_dependent
		expect(module.test_basic)
			.toBeInstanceOf(BasicModule)
			.toBe(parser.modules.test_basic)
		expect(module.renamed)
			.toBeInstanceOf(RenamedModule)
			.toBe(parser.modules.test_renamed)
	})

	it('cascades errors to dependents', async () => {
		parser = buildParser([BasicThrowingModule, RenamedModule, DependentModule])
		await parser.configure()
		parser.parseEvents([event])

		const mock = parser.modules.test_dependent.triggerEvent.mock
		// I only want to ensure the module doesn't _continue_ to parse. It's ok if it stops mid-event trigger, and it's ok if it waits until the end of the current event.
		expect(mock.calls.length).toBeLessThanOrEqual(1)
	})

	it('cascades errors to dependents while renamed', async () => {
		parser = buildParser([BasicModule, RenamedThrowingModule, DependentModule])
		await parser.configure()
		parser.parseEvents([event])

		const mock = parser.modules.test_dependent.triggerEvent.mock
		expect(mock.calls.length).toBeLessThanOrEqual(1)
	})
})
