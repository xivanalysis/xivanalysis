//region CodeUnderTest
import {GlobalCooldown} from '../GlobalCooldown'
//endregion
//region Dependencies
import {Event} from 'events'
import {Ability, AbilityType} from 'fflogs'
//endregion

// tslint:disable:no-magic-numbers

//region Mocks
import Parser from 'parser/core/Parser'
import {mockBeginCastEvent, mockCastEvent, mockDamageEvent} from '__mocks__/EventMocks'
import {MockedData} from '__mocks__/Data'
import {Timeline, mockRowAddItem} from '__mocks__/Timeline'
import {Statistics} from '__mocks__/Statistics'
import Downtime from '__mocks__/Downtime'
import {Action} from 'data/ACTIONS'

jest.mock('parser/core/Parser')
const MockedParser = Parser as jest.Mock<Parser>

//region MockData
const data = new MockedData()
data.mockAction({id: 0, icon: '', name: 'ATTACK'})
const GCDCastAbility: Ability = {guid: 1, abilityIcon: '', name: 'Ability 1', type: AbilityType.PHYSICAL_DIRECT}
const GCDCastAction: Action = {
	id: 1,
	name: 'Ability 1',
	icon: '',
	onGcd: true,
	castTime: 2.5,
	cooldown: 2.5,
}
data.mockAction(GCDCastAction)

const GCDInstantAbility: Ability = {guid: 2, abilityIcon: '', name: 'Ability 2', type: AbilityType.PHYSICAL_DIRECT}
const GCDInstantAction: Action = {
	id: 2,
	name: 'Ability 2',
	icon: '',
	onGcd: true,
}
data.mockAction(GCDInstantAction)

const GCDShortRecastAbility: Ability = {guid: 3, abilityIcon: '', name: 'Ability 3', type: AbilityType.PHYSICAL_DIRECT}
const GCDShortRecastAction: Action = {
	id: 3,
	name: 'Ability 3',
	icon: '',
	onGcd: true,
	cooldown: 1,
}
data.mockAction(GCDShortRecastAction)

const GCDLongCooldownAbility: Ability = {guid: 4, abilityIcon: '', name: 'Ability 4', type: AbilityType.PHYSICAL_DIRECT}
const GCDLongCooldownAction: Action = {
	id: 4,
	name: 'Ability 4',
	icon: '',
	onGcd: true,
	cooldown: 60,
	gcdRecast: 2.5,
}
data.mockAction(GCDLongCooldownAction)

const UnknownAbility: Ability = {guid: 5, abilityIcon: '', name: 'Ability 5', type: AbilityType.PHYSICAL_DIRECT}
const UnknownAction: Action = {
	id: 5,
	name: 'Ability 5',
	icon: '',
}

const OffGCDAbility: Ability = {guid: 6, abilityIcon: '', name: 'Ability 6', type: AbilityType.PHYSICAL_DIRECT}
const OffGCDAction: Action = {
	id: 6,
	name: 'Ability 6',
	icon: '',
	cooldown: 90,
}
data.mockAction(OffGCDAction)

const GCDLongCastAbility: Ability = {guid: 7, abilityIcon: '', name: 'Ability 7', type: AbilityType.PHYSICAL_DIRECT}
const GCDLongCastAction: Action = {
	id: 7,
	name: 'Ability 7',
	icon: '',
	cooldown: 2.5,
	onGcd: true,
	castTime: 3,
}
data.mockAction(GCDLongCastAction)
//endregion
//region MockEvents
function arrangeMockEvents(): Event[] {
	return [
		mockCastEvent(100, GCDCastAbility),
		mockBeginCastEvent(500, GCDCastAbility),
		mockCastEvent(2450, GCDCastAbility),
		mockDamageEvent(2950, GCDCastAbility),
		mockCastEvent(3050, GCDInstantAbility),
		mockCastEvent(3850, UnknownAbility),
		mockCastEvent(4600, OffGCDAbility),
		mockCastEvent(5535, GCDShortRecastAbility),
		mockCastEvent(6535, GCDLongCooldownAbility),
		mockBeginCastEvent(9030, GCDCastAbility),
		mockBeginCastEvent(10030, GCDCastAbility),
		mockCastEvent(11030, GCDInstantAbility),
		mockBeginCastEvent(13530, GCDLongCastAbility),
		mockCastEvent(16030, GCDLongCastAbility),
		mockCastEvent(16630, GCDLongCastAbility),
		mockCastEvent(19130, GCDInstantAbility),
	]
}
//endregion
//endregion

//region Tests
describe('The GlobalCooldown module', () => {
	let globalCooldown: GlobalCooldown
	let parser: Parser
	let timeline: Timeline
	let statistics: Statistics
	let downtime: Downtime
	const events: Event[] = arrangeMockEvents()

	beforeEach(() => {
		parser = new MockedParser()
		timeline = new Timeline(parser)
		statistics = new Statistics(parser)
		downtime = new Downtime(parser)
		Object.defineProperty(parser, 'fight', {value: {start_time: 0}})
		Object.defineProperty(parser, 'modules', {value: {data, timeline, statistics, downtime}})

		globalCooldown = new GlobalCooldown(parser)
	})

	it('uses the handle gcd', () => {
		expect(GlobalCooldown.handle).toBe('gcd')
	})

	it('has a normalise method', () => {
		expect(globalCooldown).toHaveProperty('normalise')
	})

	describe('When building the gcd estimate', () => {
		const getAction = jest.spyOn(data, 'getAction')

		beforeEach(() => {
			globalCooldown.normalise(events)
		})

		it('looks up the action data for each ability on a cast or begincast event', () => {
			expect(getAction).toHaveBeenCalledTimes(15)
		})

		describe('when building a list of cast actions', () => {
			it('matches begincast and cast events', () => {
				expect(globalCooldown.gcds).toEqual(
					expect.arrayContaining([
						expect.objectContaining(searchForAction(GCDCastAction, 500, 2450)),
					]),
				)
			})

			it('ignores unknown abilities', () => {
				expect(globalCooldown.gcds).not.toEqual(
					expect.arrayContaining([
						expect.objectContaining(searchForAction(UnknownAction, undefined, 3850)),
					]),
				)
			})

			it('ignores off gcd abilities', () => {
				expect(globalCooldown.gcds).not.toEqual(
					expect.arrayContaining([
						expect.objectContaining(searchForAction(OffGCDAction, undefined, 4650)),
					]),
				)
			})

			it('leaves an unmatched begincast if the cast is interrupted and restarted', () => {
				expect(globalCooldown.gcds).toEqual(
					expect.arrayContaining([
						expect.objectContaining(searchForAction(GCDCastAction, 9030, undefined)),
					]),
				)
			})

			it('leaves an unmatched begincast if the cast is interrupted and a different skill is cast', () => {
				expect(globalCooldown.gcds).toEqual(
					expect.arrayContaining([
						expect.objectContaining(searchForAction(GCDCastAction, 10030, undefined)),
					]),
				)
			})
		})

		describe('when building a list of GCD intervals', () => {
			describe('given the first cast is an action with a castTime that did not have a begincast event', () => {
				// Omit pre-pull channels because we don't have data on when they started channeling
				it('ignores the first cast', () => {
					expect(globalCooldown.intervals).not.toEqual(
						expect.arrayContaining([
							expect.objectContaining({
								firstAction: searchForAction(GCDCastAction, undefined, 100),
							}),
						]),
					)
				})
			})

			it('calculates the interval between two instant casts', () => {
				expect(globalCooldown.intervals).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							firstAction: searchForAction(GCDInstantAction, undefined, 3050),
							secondAction: searchForAction(GCDShortRecastAction, undefined, 5535),
							interval: 2485,
							normalisedInterval: 2485,
						}),
					]),
				)
			})

			it('adjusts the interval after a channeled cast for caster tax', () => {
				expect(globalCooldown.intervals).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							firstAction: searchForAction(GCDCastAction, 500, 2450),
							secondAction: searchForAction(GCDInstantAction, undefined, 3050),
							interval: 2450,
							normalisedInterval: 2450,
						}),
					]),
				)
			})

			it('includes a normalisedInterval that adjusts skills with short cooldowns as though they had a cooldown that matched the base GCD', () => {
				expect(globalCooldown.intervals).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							firstAction: searchForAction(GCDShortRecastAction, undefined, 5535),
							secondAction: searchForAction(GCDLongCooldownAction, undefined, 6535),
							interval: 1000,
							normalisedInterval: 2500,
						}),
					]),
				)
			})

			it('does not adjust interval for skills with a long cooldown but a gcdRecast that matches the base GCD', () => {
				expect(globalCooldown.intervals).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							firstAction: searchForAction(GCDLongCooldownAction, undefined, 6535),
							secondAction: searchForAction(GCDCastAction, 9030, undefined),
							interval: 2495,
							normalisedInterval: 2495,
						}),
					]),
				)
			})

			it('includes a normalisedInterval that adjusts skills with long cast times as though they had a cast time that matched the base GCD', () => {
				expect(globalCooldown.intervals).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							firstAction: searchForAction(GCDLongCastAction, 13530, 16030),
							secondAction: searchForAction(GCDLongCastAction, undefined, 16630),
							interval: 3000,
							normalisedInterval: 2500,
						}),
					]),
				)
			})

			it('does not adjust interval for skills with a long cast time that were cast instantly', () => {
				expect(globalCooldown.intervals).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							firstAction: searchForAction(GCDLongCastAction, undefined, 16630),
							secondAction: searchForAction(GCDInstantAction, undefined, 19130),
							interval: 2500,
							normalisedInterval: 2500,
						}),
					]),
				)
			})

			it('ignores actions that were interrupted', () => {
				expect(globalCooldown.intervals).not.toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							firstAction: searchForAction(GCDCastAction, 9030, undefined),
						}),
					]),
				)

				expect(globalCooldown.intervals).not.toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							firstAction: searchForAction(GCDCastAction, 10030, undefined),
						}),
					]),
				)
			})

			it('ignores the last action of the fight', () => {
				expect(globalCooldown.intervals).not.toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							firstAction: searchForAction(GCDInstantAction, undefined, 19130),
						}),
					]),
				)
			})
		})

		describe('when checking GCD intervals to estimate GCD', () => {
			it('rounds the intervals to the nearest 10ms and returns the most commonly seen interval', () => {
				const estimatedGcd = globalCooldown.getEstimate()
				expect(estimatedGcd).toBe(2500)
			})
		})
	})

	describe('When the parser completes', () => {
		beforeEach(() => {
			mockRowAddItem.mockReset()
			globalCooldown.normalise(events)
			globalCooldown.onComplete()
		})

		it('adds a row to the timeline to display all GCDs', () => {
			jest.spyOn(timeline, 'addRow')
			expect(timeline.addRow).toHaveBeenCalledTimes(1)
		})

		it('adds each GCD to the display row', () => {
			expect(mockRowAddItem).toHaveBeenCalledTimes(11)
		})

		it('adds a statistic with the estimated GCD', () => {
			expect(statistics.add).toHaveBeenCalled()
		})

		it('returns an estimated GCD', () => {
			expect(globalCooldown.getEstimate()).toEqual(2500)
			expect(globalCooldown.estimatedGcd).toEqual(2500)
		})

		it('returns estimated GCD uptime', () => {
			// TODO: make this test more well defined rather than just a black box
			// - Excludes interrupted skills
			// - Counts lesser of time from fight start to second skill or estimated GCD length if first skill is an "instant" of a skill with cast time
			jest.spyOn(downtime, 'getDowntime').mockReturnValue(0)
			expect(globalCooldown.getUptime()).toEqual(19700)
		})
	})
})
//endregion

//region Assertion Functions
interface ActionSearchObject {
	action: Action,
	events: {
		beginCast: any,
		cast: any,
	},
}

function searchForAction(action: Action, beginCast: number | undefined, cast: number | undefined) : ActionSearchObject {
	const searchObject: ActionSearchObject = {
		action,
		events: {
			beginCast: undefined,
			cast: undefined,
		},
	}
	if (beginCast) {
		searchObject.events.beginCast = expect.objectContaining({timestamp: beginCast})
	}
	if (cast) {
		searchObject.events.cast = expect.objectContaining({timestamp: cast})
	}

	return searchObject
}
//endregion
