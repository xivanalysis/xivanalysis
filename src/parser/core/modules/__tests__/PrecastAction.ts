import PrecastAction from 'parser/core/modules/PrecastAction'
import Parser from 'parser/core/Parser'
import {AbilityType, CastEvent, DamageEvent, Event, HitType} from 'fflogs'

jest.mock('parser/core/Parser')
const MockedParser = Parser as jest.Mock<Parser>

// tslint:disable:no-magic-numbers

const fightStartTime = 0
const mockCastEvent = (timestamp: number): CastEvent => {
	return {
		type: 'cast',
		timestamp,
		ability: {abilityIcon: '', guid: 0, name: '', type: AbilityType.PHYSICAL_DIRECT},
		sourceIsFriendly: true,
		targetIsFriendly: false,
	}
}
const mockDamageEvent = (timestamp: number): DamageEvent => {
	return {
		type: 'damage',
		absorbed: 0,
		criticalHit: false,
		directHit: false,
		successfulHit: true,
		hitType: HitType.NORMAL,
		amount: 0,
		targetResources: {
			hitPoints: 0,
			maxHitPoints: 0,
			mp: 0,
			maxMP: 0,
			tp: 0,
			maxTP: 0,
			x: 0,
			y: 0,
		},
		ability: {abilityIcon: '', guid: 0, name: '', type: AbilityType.PHYSICAL_DIRECT},
		timestamp,
		sourceIsFriendly: true,
		targetIsFriendly: false,
	}
}
const mockAutoAttackCast = (timestamp: number): CastEvent => {
	const cast = mockCastEvent(timestamp)
	cast.ability.name = 'attack'
	return cast
}
const precastSyntheticCast = (timestamp: number): CastEvent => {
	const synthEvent = mockDamageEvent(timestamp) as Event
	synthEvent.timestamp = fightStartTime
	synthEvent.type = 'cast'
	return synthEvent as CastEvent
}

describe('The PrecastAction module', () => {
	let precastAction: PrecastAction
	let parser: Parser
	let events: Array<Event | CastEvent | DamageEvent>
	let byPlayer: jest.SpyInstance<boolean, [Event, (number | undefined)?]>

	beforeEach(() => {
		parser = new MockedParser()
		Object.defineProperty(parser, 'fight', {value: {start_time: fightStartTime}})
		byPlayer = jest.spyOn(parser, 'byPlayer').mockReturnValue(true)

		precastAction = new PrecastAction(parser)
	})

	it('has a normalise method', () => {
		expect(precastAction).toHaveProperty('normalise')
	})

	it('ignores events from other actors', () => {
		byPlayer.mockReturnValue(false)
		events = [
			mockDamageEvent(100),
		]
		precastAction.normalise(events)
		expect(events).toEqual([mockDamageEvent(100)])
	})

	it('does not exit early on autoattack events', () => {
		const events = [
			mockAutoAttackCast(50),
			mockDamageEvent(100),
		]
		precastAction.normalise(events)
		expect(byPlayer).toHaveBeenCalledTimes(2)
	})

	it('exits early on seeing a cast event', () => {
		const events = [
			mockCastEvent(50),
			mockDamageEvent(100),
		]
		precastAction.normalise(events)
		expect(byPlayer).toHaveBeenCalledTimes(1)
		expect(events).toEqual([mockCastEvent(50), mockDamageEvent(100)])
	})

	describe('given the first valid event is a damage event', () => {
		it('adds a cast event to the beginning of the events array', () => {
			const events = [
				mockDamageEvent(100),
			]
			precastAction.normalise(events)
			expect(events).toEqual([precastSyntheticCast(100), mockDamageEvent(100)])
		})

		it('stops checking events after the first damage event', () => {
			const events = [
				mockDamageEvent(100),
				mockDamageEvent(2500),
			]
			precastAction.normalise(events)
			expect(byPlayer).toHaveBeenCalledTimes(1)
			expect(events).toEqual([precastSyntheticCast(100), mockDamageEvent(100), mockDamageEvent(2500)])
		})
	})
})
