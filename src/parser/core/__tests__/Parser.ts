import {GameEdition} from 'data/EDITIONS'
import {Event} from 'event'
import {Actor, Pull, Report, ReportMeta, Team} from 'report'
import {Analyser} from '../Analyser'
import {Dispatcher} from '../Dispatcher'
import {Injectable} from '../Injectable'
import {Meta} from '../Meta'
import {Parser} from '../Parser'

/* eslint-disable @typescript-eslint/no-magic-numbers */

// Testing modules
class BasicAnalyser extends Analyser {
	static override handle = 'test_basic'
}
class RenamedAnalyser extends Analyser {
	static override handle = 'test_renamed'
}
class DependentAnalyser extends Analyser {
	static override handle = 'test_dependent'
	static override dependencies = [
		'test_basic',
		{handle: 'test_renamed', prop: 'renamed'},
	]
	declare test_basic: BasicAnalyser
	declare renamed: RenamedAnalyser
}

class TestDispatcher implements Dispatcher {
	timestamp = 0
	dispatch = jest.fn()
	addEventHook = jest.fn()
	removeEventHook = jest.fn()
	addTimestampHook = jest.fn()
	removeTimestampHook = jest.fn()
}

const REPORT_START_TIME = 10000
const PULL_START_TIME_OFFSET = 1000
const NEW_EVENT_OFFSET = REPORT_START_TIME + PULL_START_TIME_OFFSET

// Bunch of basic testing data
const actor: Actor = {
	id: '1',
	kind: '1',
	name: 'In Fight',
	team: Team.FRIEND,
	playerControlled: true,
	job: 'UNKNOWN',
}
const pull: Pull = {
	id: '1',
	timestamp: NEW_EVENT_OFFSET,
	duration: 100,
	encounter: {
		name: 'Test encounter',
		duty: {id: -1, name: 'Test duty'},
	},
	actors: [actor],
}
const report: Report = {
	timestamp: REPORT_START_TIME,
	edition: GameEdition.GLOBAL,
	name: 'Test report',
	pulls: [pull],
	meta: {source: '__test'} as unknown as ReportMeta,
}
const event: Event = {
	type: '__test',
	timestamp: NEW_EVENT_OFFSET+50,
} as unknown as Event

const buildParser = (modules: Array<typeof Injectable> = []) => {
	const dispatcher = new TestDispatcher()
	dispatcher.timestamp = 0
	dispatcher.dispatch.mockReturnValue([])

	const parser = new Parser({
		meta: new Meta({modules: () => Promise.resolve({modules})}),

		report,
		pull,
		actor,

		dispatcher,
	})

	return [parser, dispatcher] as const
}

describe('Parser', () => {
	let parser: Parser
	let dispatcher: TestDispatcher

	beforeEach(() => {
		const [newParser, newDispatcher] = buildParser()
		parser = newParser
		dispatcher = newDispatcher
	})

	it('exposes metadata', () => {
		// Just making sure that modules will have access to it
		expect(parser.report).toMatchObject(report)
		expect(parser.pull).toMatchObject(pull)
		expect(parser.actor).toMatchObject(actor)
	})

	it('starts at beginning of fight', () => {
		dispatcher.timestamp = -Infinity
		expect(parser.currentEpochTimestamp).toBe(pull.timestamp)
	})

	it('does not exceed fight end time', () => {
		dispatcher.timestamp = Infinity
		expect(parser.currentEpochTimestamp).toBe(pull.timestamp + pull.duration)
	})

	it('loads analysers', async () => {
		const [parser] = buildParser([BasicAnalyser])
		await parser.configure()

		expect(parser.container).toHaveProperty('test_basic')
		expect(parser.container.test_basic).toBeInstanceOf(BasicAnalyser)
	})

	it('dispatches events', async () => {
		await parser.configure()
		parser.parseEvents({events: [event]})

		expect(dispatcher.dispatch).toHaveBeenCalledTimes(2)
		const {calls} = dispatcher.dispatch.mock
		expect(calls[0][0]).toEqual(event)
		expect(calls[1][0]).toContainEntry(['type', 'complete'])
	})

	it('stops dispatching to analysers that error', async () => {
		const [parser, dispatcher] = buildParser([BasicAnalyser])
		dispatcher.dispatch.mockReturnValueOnce([{handle: 'test_basic', error: new Error('test')}])
		await parser.configure()
		parser.parseEvents({
			events: [
				{type: 'test', timestamp: 50},
				{type: 'test', timestamp: 60},
			] as unknown as Event[],
		})

		const {calls} = dispatcher.dispatch.mock
		expect(calls[0][1]).toEqual(['test_basic'])
		expect(calls[1][1]).toEqual([])
	})

	it('links dependencies', async () => {
		const [parser] = buildParser([BasicAnalyser, DependentAnalyser, RenamedAnalyser])
		await parser.configure()

		const module = parser.container.test_dependent as DependentAnalyser
		expect(module.test_basic)
			.toBeInstanceOf(BasicAnalyser)
			.toBe(parser.container.test_basic)
		expect(module.renamed)
			.toBeInstanceOf(RenamedAnalyser)
			.toBe(parser.container.test_renamed)
	})

	it('cascades errors to dependents', async () => {
		const [parser, dispatcher] = buildParser([BasicAnalyser, RenamedAnalyser, DependentAnalyser])
		dispatcher.dispatch.mockReturnValueOnce([{handle: 'test_basic', error: new Error('test')}])
		await parser.configure()
		parser.parseEvents({events: [event]})

		const {calls} = dispatcher.dispatch.mock
		expect(calls[0][1]).toEqual(['test_renamed', 'test_basic', 'test_dependent'])
		expect(calls[1][1]).toEqual(['test_renamed'])
	})

	it('cascades errors to dependents while renamed', async () => {
		const [parser, dispatcher] = buildParser([BasicAnalyser, RenamedAnalyser, DependentAnalyser])
		dispatcher.dispatch.mockReturnValueOnce([{handle: 'test_renamed', error: new Error('test')}])
		await parser.configure()
		parser.parseEvents({events: [event]})

		const {calls} = dispatcher.dispatch.mock
		expect(calls[0][1]).toEqual(['test_renamed', 'test_basic', 'test_dependent'])
		expect(calls[1][1]).toEqual(['test_basic'])
	})

	it('queues new events for dispatch', async () => {
		const toQueue = [
			{timestamp: NEW_EVENT_OFFSET+50, type: '__queuedEvent'},
			{timestamp: NEW_EVENT_OFFSET+70, type: '__queuedEvent'},
			{timestamp: NEW_EVENT_OFFSET+0, type: '__queuedEvent'},
		] as unknown as Event[]
		const dispatchedEvents: Array<{event:Event, timestamp: number}> = []

		function mockDispatch(this: TestDispatcher, event: Event) {
			this.timestamp = event.timestamp
			dispatchedEvents.push({event, timestamp: parser.currentEpochTimestamp})
			if (toQueue.length > 0) { parser.queueEvent(toQueue.shift()!) }
			return []
		}

		dispatcher.dispatch.mockImplementation(mockDispatch)

		await parser.configure()
		parser.parseEvents({
			events: [
				{timestamp: NEW_EVENT_OFFSET+0, type: '__sourceEvent'},
				{timestamp: NEW_EVENT_OFFSET+50, type: '__sourceEvent'},
				{timestamp: NEW_EVENT_OFFSET+100, type: '__sourceEvent'},
			] as unknown as Event[],
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
			.toEqual([0, 50, 50, 70, 100, 100].map(n => NEW_EVENT_OFFSET+n))
	})
})
