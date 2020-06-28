import Module from '../Module'
import Parser from '../Parser'
import {Meta} from '../Meta'
import {Dispatcher} from '../Dispatcher'
import {GameEdition} from 'data/PATCHES'
import {Team} from 'report'

jest.mock('../Dispatcher')

/* eslint-disable @xivanalysis/no-unused-dependencies, no-magic-numbers */

// Testing modules
class BasicModule extends Module {
	static handle = 'test_basic'
	normalise = jest.fn(events => events)
}
class RenamedModule extends Module {
	static handle = 'test_renamed'
}
class DependentModule extends Module {
	static handle = 'test_dependent'
	static dependencies = [
		'test_basic',
		{handle: 'test_renamed', prop: 'renamed'},
	]
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

const actor = {
	id: '1',
	name: 'In Fight',
	team: Team.FRIEND,
	playerControlled: true,
	job: 'UNKNOWN',
}
const pull = {
	id: '1',
	timestamp: 0,
	duration: 100,
	encounter: {
		name: 'Test encounter',
		duty: {id: -1, name: 'Test duty'}
	},
	actors: [actor]
}
const newReport = {
	timestamp: 0,
	edition: GameEdition.GLOBAL,
	name: 'Test report',
	pulls: [pull],
	meta: {source: '__test'}
}

const buildParser = (modules = []) => new Parser({
	meta: new Meta({modules: () => Promise.resolve({default: modules})}),
	report,
	fight,
	fflogsActor: friendlyInFight,

	newReport,
	pull,
	actor,

	dispatcher: new Dispatcher(),
})

describe('Parser', () => {
	let parser
	let dispatcher

	beforeEach(() => {
		Dispatcher.mockClear()
		parser = buildParser()
		dispatcher = Dispatcher.mock.instances[0]
	})

	it('exposes metadata', () => {
		// Just making sure that modules will have access to it
		expect(parser.report).toMatchObject(report)
		expect(parser.fight).toMatchObject(fight)
		expect(parser.player).toMatchObject(friendlyInFight)
	})

	it('starts at beginning of fight', () => {
		dispatcher.timestamp = -Infinity
		expect(parser.currentTimestamp).toBe(fight.start_time)
	})

	it('does not exceed fight end time', () => {
		dispatcher.timestamp = Infinity
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

	it('dispatches events', async () => {
		await parser.configure()
		parser.parseEvents([event])

		expect(dispatcher.dispatch).toHaveBeenCalledTimes(3)
		const {calls} = dispatcher.dispatch.mock
		expect(calls[0][0]).toContainEntry(['type', 'init'])
		expect(calls[1][0]).toEqual(event)
		expect(calls[2][0]).toContainEntry(['type', 'complete'])
	})

	it('stops dispatching to modules that error', async () => {
		parser = buildParser([BasicModule])
		dispatcher = Dispatcher.mock.instances[1]
		dispatcher.dispatch.mockReturnValueOnce({test_basic: new Error('test')})
		await parser.configure()
		parser.parseEvents([event])

		const {calls} = dispatcher.dispatch.mock
		expect(calls[0][1]).toEqual(['test_basic'])
		expect(calls[1][1]).toEqual([])
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
		parser = buildParser([BasicModule, RenamedModule, DependentModule])
		dispatcher = Dispatcher.mock.instances[1]
		dispatcher.dispatch.mockReturnValueOnce({test_basic: new Error('test')})
		await parser.configure()
		parser.parseEvents([event])

		const {calls} = dispatcher.dispatch.mock
		expect(calls[0][1]).toEqual(['test_renamed', 'test_basic', 'test_dependent'])
		expect(calls[1][1]).toEqual(['test_renamed'])
	})

	it('cascades errors to dependents while renamed', async () => {
		parser = buildParser([BasicModule, RenamedModule, DependentModule])
		dispatcher = Dispatcher.mock.instances[1]
		dispatcher.dispatch.mockReturnValueOnce({test_renamed: new Error('test')})
		await parser.configure()
		parser.parseEvents([event])

		const {calls} = dispatcher.dispatch.mock
		expect(calls[0][1]).toEqual(['test_renamed', 'test_basic', 'test_dependent'])
		expect(calls[1][1]).toEqual(['test_basic'])
	})
})
