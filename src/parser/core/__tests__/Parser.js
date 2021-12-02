import {GameEdition} from 'data/EDITIONS'
import {Team} from 'report'
import {Analyser} from '../Analyser'
import {Dispatcher} from '../Dispatcher'
import {LegacyDispatcher} from '../LegacyDispatcher'
import {Meta} from '../Meta'
import Parser from '../Parser'

jest.mock('../LegacyDispatcher')
jest.mock('../Dispatcher')

/* eslint-disable @xivanalysis/no-unused-dependencies, @typescript-eslint/no-magic-numbers */

// Testing modules
class BasicAnalyser extends Analyser {
	static handle = 'test_basic'
}
class RenamedAnalyser extends Analyser {
	static handle = 'test_renamed'
}
class DependentAnalyser extends Analyser {
	static handle = 'test_dependent'
	static dependencies = [
		'test_basic',
		{handle: 'test_renamed', prop: 'renamed'},
	]
}

const REPORT_START_TIME = 10000
const PULL_START_TIME_OFFSET = 1000
const OLD_EVENT_OFFSET = PULL_START_TIME_OFFSET
const NEW_EVENT_OFFSET = REPORT_START_TIME + PULL_START_TIME_OFFSET

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
	start: REPORT_START_TIME,
	friendlies: [friendlyInFight, friendlyNotInFight],
	friendlyPets: [],
}
const fight = {
	id: 1,
	start_time: PULL_START_TIME_OFFSET,
	end_time: PULL_START_TIME_OFFSET+100,
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
	timestamp: REPORT_START_TIME+PULL_START_TIME_OFFSET,
	duration: 100,
	encounter: {
		name: 'Test encounter',
		duty: {id: -1, name: 'Test duty'},
	},
	actors: [actor],
}
const newReport = {
	timestamp: REPORT_START_TIME,
	edition: GameEdition.GLOBAL,
	name: 'Test report',
	pulls: [pull],
	meta: {source: '__test'},
}

const buildParser = (modules = []) => {
	const legacyDispatcher = new LegacyDispatcher()
	legacyDispatcher.timestamp = 0

	const dispatcher = new Dispatcher()
	dispatcher.timestamp = 0
	dispatcher.dispatch.mockReturnValue([])

	return new Parser({
		meta: new Meta({modules: () => Promise.resolve({default: modules})}),
		report,
		fight,
		fflogsActor: friendlyInFight,

		newReport,
		pull,
		actor,

		legacyDispatcher,
		dispatcher,
	})
}

describe('Parser', () => {
	let parser
	let dispatcher
	let legacyDispatcher

	beforeEach(() => {
		Dispatcher.mockClear()
		LegacyDispatcher.mockClear()

		parser = buildParser()

		dispatcher = Dispatcher.mock.instances[0]
		legacyDispatcher = LegacyDispatcher.mock.instances[0]
	})

	it('exposes metadata', () => {
		// Just making sure that modules will have access to it
		expect(parser.report).toMatchObject(report)
		expect(parser.fight).toMatchObject(fight)
		expect(parser.player).toMatchObject(friendlyInFight)
	})

	it('starts at beginning of fight', () => {
		dispatcher.timestamp = -Infinity
		legacyDispatcher.timestamp = -Infinity
		expect(parser.currentTimestamp).toBe(fight.start_time)
	})

	it('does not exceed fight end time', () => {
		dispatcher.timestamp = Infinity
		legacyDispatcher.timestamp = Infinity
		expect(parser.currentTimestamp).toBe(fight.end_time)
		expect(parser.fightDuration).toBe(fight.end_time - fight.start_time)
	})

	it('filters to friendlies in fight', () => {
		expect(parser.fightFriendlies)
			.toContain(friendlyInFight)
			.not.toContain(friendlyNotInFight)
	})

	it('loads analysers', async () => {
		parser = buildParser([BasicAnalyser])
		await parser.configure()

		expect(parser.container).toHaveProperty('test_basic')
		expect(parser.container.test_basic).toBeInstanceOf(BasicAnalyser)
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

	it('stops dispatching to analysers that error', async () => {
		parser = buildParser([BasicAnalyser])
		dispatcher = Dispatcher.mock.instances[1]
		dispatcher.dispatch.mockReturnValueOnce([{handle: 'test_basic', error: new Error('test')}])
		await parser.configure()
		parser.parseEvents({
			events: [
				{type: 'test', timestamp: 50},
				{type: 'test', timestamp: 60},
			],
			legacyEvents: [],
		})

		const {calls} = dispatcher.dispatch.mock
		expect(calls[0][1]).toEqual(['test_basic'])
		expect(calls[1][1]).toEqual([])
	})

	it('links dependencies', async () => {
		parser = buildParser([BasicAnalyser, DependentAnalyser, RenamedAnalyser])
		await parser.configure()

		const module = parser.container.test_dependent
		expect(module.test_basic)
			.toBeInstanceOf(BasicAnalyser)
			.toBe(parser.container.test_basic)
		expect(module.renamed)
			.toBeInstanceOf(RenamedAnalyser)
			.toBe(parser.container.test_renamed)
	})

	it('cascades errors to dependents', async () => {
		parser = buildParser([BasicAnalyser, RenamedAnalyser, DependentAnalyser])
		legacyDispatcher = LegacyDispatcher.mock.instances[1]
		legacyDispatcher.dispatch.mockReturnValueOnce({test_basic: new Error('test')})
		await parser.configure()
		parser.parseEvents({events: [], legacyEvents: [event]})

		const {calls} = legacyDispatcher.dispatch.mock
		expect(calls[0][1]).toEqual(['test_renamed', 'test_basic', 'test_dependent'])
		expect(calls[1][1]).toEqual(['test_renamed'])
	})

	it('cascades errors to dependents while renamed', async () => {
		parser = buildParser([BasicAnalyser, RenamedAnalyser, DependentAnalyser])
		legacyDispatcher = LegacyDispatcher.mock.instances[1]
		legacyDispatcher.dispatch.mockReturnValueOnce({test_renamed: new Error('test')})
		await parser.configure()
		parser.parseEvents({events: [], legacyEvents: [event]})

		const {calls} = legacyDispatcher.dispatch.mock
		expect(calls[0][1]).toEqual(['test_renamed', 'test_basic', 'test_dependent'])
		expect(calls[1][1]).toEqual(['test_basic'])
	})

	it('queues new events for dispatch', async () => {
		const toQueue = [
			{timestamp: NEW_EVENT_OFFSET+50, type: '__queuedEvent'},
			{timestamp: NEW_EVENT_OFFSET+70, type: '__queuedEvent'},
			{timestamp: NEW_EVENT_OFFSET+0, type: '__queuedEvent'},
		]
		const dispatchedEvents = []

		function mockDispatch(event) {
			this.timestamp = event.timestamp
			dispatchedEvents.push({event, timestamp: parser.currentTimestamp})
			if (toQueue.length > 0) { parser.queueEvent(toQueue.shift()) }
			return []
		}

		dispatcher.dispatch.mockImplementation(mockDispatch)

		await parser.configure()
		parser.parseEvents({
			events: [
				{timestamp: NEW_EVENT_OFFSET+0, type: '__sourceEvent'},
				{timestamp: NEW_EVENT_OFFSET+50, type: '__sourceEvent'},
				{timestamp: NEW_EVENT_OFFSET+100, type: '__sourceEvent'},
			],
			legacyEvents: [],
		})

		expect(dispatchedEvents.map(({event}) => event.type)).toEqual([
			'__sourceEvent',
			'__sourceEvent',
			'__queuedEvent',
			'__queuedEvent',
			'__sourceEvent',
			'complete',
		])
		expect(dispatchedEvents.map(({timestamp}) => timestamp))
			.toEqual([0, 50, 50, 70, 100, 100].map(n => OLD_EVENT_OFFSET+n))
	})

	describe('event migration', () => {
		[{
			name: 'equal timestamp',
			events: [{timestamp: NEW_EVENT_OFFSET+50, type: '__rfEvent'}],
			legacyEvents: [{timestamp: OLD_EVENT_OFFSET+50, type: '__lEvent'}],
			expected: {
				type: ['init', '__rfEvent', '__lEvent', 'complete', 'complete'],
				timestamp: [0, 50, 50, 100, 100].map(n => OLD_EVENT_OFFSET+n),
			},
		}, {
			name: 'flow first',
			events: [{timestamp: NEW_EVENT_OFFSET-100, type: '__rfEvent'}],
			legacyEvents: [{timestamp: OLD_EVENT_OFFSET+50, type: '__lEvent'}],
			expected: {
				type: ['__rfEvent', 'init', '__lEvent', 'complete', 'complete'],
				timestamp: [0, 0, 50, 100, 100].map(n => OLD_EVENT_OFFSET+n),
			},
		}, {
			name: 'flow last',
			events: [{timestamp: NEW_EVENT_OFFSET+200, type: '__rfEvent'}],
			legacyEvents: [{timestamp: OLD_EVENT_OFFSET+50, type: '__lEvent'}],
			expected: {
				type: ['init', '__lEvent', 'complete', '__rfEvent', 'complete'],
				timestamp: [0, 50, 100, 100, 100].map(n => OLD_EVENT_OFFSET+n),
			},
		}, {
			name: 'no flow',
			events: [],
			legacyEvents: [{timestamp: OLD_EVENT_OFFSET+50, type: '__lEvent'}],
			expected: {
				type: ['init', '__lEvent', 'complete', 'complete'],
				timestamp: [0, 50, 100, 100].map(n => OLD_EVENT_OFFSET+n),
			},
		}, {
			name: 'no legacy',
			events: [{timestamp: NEW_EVENT_OFFSET+50, type: '__rfEvent'}],
			legacyEvents: [],
			expected: {
				type: ['init', '__rfEvent', 'complete', 'complete'],
				timestamp: [0, 50, 100, 100].map(n => OLD_EVENT_OFFSET+n),
			},
		}].forEach(opts => it(`interleaves events: ${opts.name}`, async () => {
			const dispatchedEvents = []

			function mockDispatch(event) {
				this.timestamp = event.timestamp
				dispatchedEvents.push({event, timestamp: parser.currentTimestamp})
				return []
			}
			dispatcher.dispatch.mockImplementation(mockDispatch)
			legacyDispatcher.dispatch.mockImplementation(mockDispatch)

			await parser.configure()
			parser.parseEvents({
				events: opts.events,
				legacyEvents: opts.legacyEvents,
			})

			expect(dispatchedEvents.map(({event}) => event.type)).toEqual(opts.expected.type)
			expect(dispatchedEvents.map(({timestamp}) => timestamp)).toEqual(opts.expected.timestamp)
		}))
	})
})
