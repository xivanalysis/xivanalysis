import Module from '../Module'
import Parser from '../Parser'
import {Meta} from '../Meta'
import {LegacyDispatcher} from '../LegacyDispatcher'
import {Dispatcher} from '../Dispatcher'
import {GameEdition} from 'data/PATCHES'
import {Team} from 'report'
import {Analyser} from '../Analyser'

jest.mock('../LegacyDispatcher')
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

// Testing analysers
class BasicAnalyser extends Analyser {
	static handle = 'basic_analyser'
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
	type: '__testLegacy',
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

	legacyDispatcher: new LegacyDispatcher(),
	dispatcher: new Dispatcher(),
})

describe('Parser', () => {
	let parser
	let dispatcher
	let legacyDispatcher

	beforeEach(() => {
		Dispatcher.mockClear()
		LegacyDispatcher.mockClear()

		parser = buildParser()

		dispatcher = Dispatcher.mock.instances[0]
		dispatcher.dispatch.mockReturnValue([])

		legacyDispatcher = LegacyDispatcher.mock.instances[0]
	})

	it('exposes metadata', () => {
		// Just making sure that modules will have access to it
		expect(parser.report).toMatchObject(report)
		expect(parser.fight).toMatchObject(fight)
		expect(parser.player).toMatchObject(friendlyInFight)
	})

	it('starts at beginning of fight', () => {
		legacyDispatcher.timestamp = -Infinity
		expect(parser.currentTimestamp).toBe(fight.start_time)
	})

	it('does not exceed fight end time', () => {
		legacyDispatcher.timestamp = Infinity
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

		expect(parser.container).toHaveProperty('test_basic')
		expect(parser.container.test_basic).toBeInstanceOf(BasicModule)
	})

	it('runs normalisers', async () => {
		parser = buildParser([BasicModule])
		await parser.configure()
		parser.normalise([event])

		const mock = parser.container.test_basic.normalise.mock
		expect(mock.calls).toHaveLength(1)
		expect(mock.calls[0][0]).toEqual([event])
	})

	it('dispatches events', async () => {
		await parser.configure()
		parser.parseEvents({events: [], legacyEvents: [event]})

		expect(legacyDispatcher.dispatch).toHaveBeenCalledTimes(3)
		const {calls} = legacyDispatcher.dispatch.mock
		expect(calls[0][0]).toContainEntry(['type', 'init'])
		expect(calls[1][0]).toEqual(event)
		expect(calls[2][0]).toContainEntry(['type', 'complete'])
	})

	it('stops dispatching to modules that error', async () => {
		parser = buildParser([BasicModule])
		legacyDispatcher = LegacyDispatcher.mock.instances[1]
		legacyDispatcher.dispatch.mockReturnValueOnce({test_basic: new Error('test')})
		await parser.configure()
		parser.parseEvents({events: [], legacyEvents: [event]})

		const {calls} = legacyDispatcher.dispatch.mock
		expect(calls[0][1]).toEqual(['test_basic'])
		expect(calls[1][1]).toEqual([])
	})

	it('stops dispatching to analysers that error', async () => {
		parser = buildParser([BasicAnalyser])
		dispatcher = Dispatcher.mock.instances[1]
		dispatcher.dispatch
			.mockReturnValueOnce([{handle: 'basic_analyser', error: new Error('test')}])
			.mockReturnValueOnce([])
		await parser.configure()
		parser.parseEvents({events: [
			{type: 'test', timestamp: 50},
			{type: 'test', timestamp: 60},
		], legacyEvents: []})

		const {calls} = dispatcher.dispatch.mock
		expect(calls[0][1]).toEqual(['basic_analyser'])
		expect(calls[1][1]).toEqual([])
	})

	it('links dependencies', async () => {
		parser = buildParser([BasicModule, DependentModule, RenamedModule])
		await parser.configure()

		const module = parser.container.test_dependent
		expect(module.test_basic)
			.toBeInstanceOf(BasicModule)
			.toBe(parser.container.test_basic)
		expect(module.renamed)
			.toBeInstanceOf(RenamedModule)
			.toBe(parser.container.test_renamed)
	})

	it('cascades errors to dependents', async () => {
		parser = buildParser([BasicModule, RenamedModule, DependentModule])
		legacyDispatcher = LegacyDispatcher.mock.instances[1]
		legacyDispatcher.dispatch.mockReturnValueOnce({test_basic: new Error('test')})
		await parser.configure()
		parser.parseEvents({events: [], legacyEvents: [event]})

		const {calls} = legacyDispatcher.dispatch.mock
		expect(calls[0][1]).toEqual(['test_renamed', 'test_basic', 'test_dependent'])
		expect(calls[1][1]).toEqual(['test_renamed'])
	})

	it('cascades errors to dependents while renamed', async () => {
		parser = buildParser([BasicModule, RenamedModule, DependentModule])
		legacyDispatcher = LegacyDispatcher.mock.instances[1]
		legacyDispatcher.dispatch.mockReturnValueOnce({test_renamed: new Error('test')})
		await parser.configure()
		parser.parseEvents({events: [], legacyEvents: [event]})

		const {calls} = legacyDispatcher.dispatch.mock
		expect(calls[0][1]).toEqual(['test_renamed', 'test_basic', 'test_dependent'])
		expect(calls[1][1]).toEqual(['test_basic'])
	})

	describe('event migration', () => {
		[{
			name: 'equal timestamp',
			events: [{timestamp: 50, type: '__rfEvent'}],
			legacyEvents: [{timestamp: 50, type: '__lEvent'}],
			expected: ['init', '__rfEvent', '__lEvent', 'complete'],
		}, {
			name: 'flow first',
			events: [{timestamp: -100, type: '__rfEvent'}],
			legacyEvents: [{timestamp: 50, type: '__lEvent'}],
			expected: ['__rfEvent', 'init', '__lEvent', 'complete'],
		}, {
			name: 'flow last',
			events: [{timestamp: 200, type: '__rfEvent'}],
			legacyEvents: [{timestamp: 50, type: '__lEvent'}],
			expected: ['init', '__lEvent', 'complete', '__rfEvent'],
		}, {
			name: 'no flow',
			events: [],
			legacyEvents: [{timestamp: 50, type: '__lEvent'}],
			expected: ['init', '__lEvent', 'complete'],
		}, {
			name: 'no legacy',
			events: [{timestamp: 50, type: '__rfEvent'}],
			legacyEvents: [],
			expected: ['init', '__rfEvent', 'complete'],
		}].forEach(opts => it(`interleaves events: ${opts.name}`, async () => {
			const dispatchedEvents = []

			function mockDispatch(event) {
				dispatchedEvents.push(event)
				return []
			}
			dispatcher.dispatch.mockImplementation(mockDispatch)
			legacyDispatcher.dispatch.mockImplementation(mockDispatch)

			await parser.configure()
			parser.parseEvents({
				events: opts.events,
				legacyEvents: opts.legacyEvents
			})

			expect(dispatchedEvents.map(event => event.type)).toEqual(opts.expected)
		}))
	})
})
