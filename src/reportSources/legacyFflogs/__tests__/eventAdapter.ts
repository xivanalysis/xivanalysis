import {GameEdition} from 'data/EDITIONS'
import {Events} from 'event'
import {CastEvent, FflogsEvent, HitType, ReportLanguage} from 'fflogs'
import {Actor, Pull, Report, Team} from 'report'
import {adaptEvents} from '../eventAdapter'
import {AdapterStep} from '../eventAdapter/base'
import {ReassignUnknownActorStep} from '../eventAdapter/reassignUnknownActor'

// "Mock" the reassign unknown actor step with its real implementation. We use this mock handling later
// to disable the step on a test-by-test basis.
// TODO: If we need to do this >1 times, work out a cleaner way of doing this.
jest.mock('../eventAdapter/reassignUnknownActor')
type ReassignUnknownActorStepParams = ConstructorParameters<typeof ReassignUnknownActorStep>
const MockReassignUnknownActorStep = ReassignUnknownActorStep as unknown as jest.Mock<ReassignUnknownActorStep>
MockReassignUnknownActorStep.mockImplementation((...args: ReassignUnknownActorStepParams) => {
	const {ReassignUnknownActorStep} = jest.requireActual('../eventAdapter/reassignUnknownActor')
	return new ReassignUnknownActorStep(...args)
})

const actor: Actor = {
	id: '1',
	kind: '1',
	name: 'Test Actor',
	team: Team.FRIEND,
	playerControlled: true,
	job: 'UNKNOWN',
}

// Semi-arbitrary time during 5.3. Needs to be post-5.08 for code path purposes.
const timestamp = 1600000000000

const pull: Pull = {
	id: '1',
	timestamp,
	duration: 1,
	encounter: {
		name: 'test encounter',
		duty: {
			id: 1,
			name: 'test duty',
		},
	},
	actors: [actor],
}

const report: Report = {
	timestamp,
	edition: GameEdition.GLOBAL,
	name: 'Event adapter test',
	pulls: [pull],
	meta: {
		source: 'legacyFflogs',
		code: 'adapterTest',
		loading: false,
		enemies: [],
		enemyPets: [],
		fights: [],
		friendlies: [],
		friendlyPets: [],
		lang: ReportLanguage.ENGLISH,
		phases: [],
		end: Infinity,
		owner: 'test',
		start: 0,
		title: 'Event adapter test',
		zone: 0,
	},
}

// Below is a "fake" definition of every fflogs type we have typed in the codebase.
// It's long - you'll probably want to collapse it
// #region FFLogs event definitions

const fakeAbility = {
	name: 'Fake Ability',
	guid: -1,
	type: 0,
	abilityIcon: 'fakeAbilityIcon',
}

// For stuff that will never have them
const fakeBaseFields = {
	sourceIsFriendly: false,
	targetIsFriendly: false,
}

// These are injected by the hit type module, I can't be bothered typing around them
const fakeHitTypeFields = {
	criticalHit: false,
	directHit: false,
	successfulHit: true,
}

const fakeEvents: Record<FflogsEvent['type'], FflogsEvent[]> = {
	encounterstart: [{
		...fakeBaseFields,
		timestamp: 10131563,
		type: 'encounterstart',
		encounterID: 4525,
		name: "the Heroes' Gauntlet",
		difficulty: 10,
		size: 4,
		level: 0,
		affixes: [],
	}],
	encounterend: [{
		...fakeBaseFields,
		timestamp: 8588978,
		type: 'encounterend',
		encounterID: 947,
		name: "Eden's Promise: Litany (Savage)",
		difficulty: 0,
		size: 8,
		kill: true,
	}],
	calculateddamage: [{
		timestamp: 8011183,
		type: 'calculateddamage',
		sourceID: 1,
		sourceIsFriendly: true,
		targetID: 3,
		targetIsFriendly: false,
		ability: {
			name: 'Fang and Claw',
			guid: 3554,
			type: 128,
			abilityIcon: '002000-002582.png',
		},
		hitType: 2,
		amount: 0,
		multiplier: 1.1,
		packetID: 16647,
		sourceResources: {
			hitPoints: 142411,
			maxHitPoints: 142411,
			mp: 10000,
			maxMP: 10000,
			tp: 0,
			maxTP: 1000,
			x: 9260,
			y: 10463,
			facing: -245,
			absorb: 0,
		},
		targetResources: {
			hitPoints: 67180802,
			maxHitPoints: 75722720,
			mp: 10000,
			maxMP: 10000,
			tp: 0,
			maxTP: 1000,
			x: 9999,
			y: 10081,
			facing: -160,
			absorb: 0,
		},
		...fakeHitTypeFields,
	}],
	damage: [{
		ability: {
			abilityIcon: '012000-012507.png',
			guid: 1000725,
			name: 'Goring Blade',
			type: 1,
		},
		absorbed: 0,
		actorPotencyRatio: 35.96633490558984,
		amount: 4176,
		directHitPercentage: 0.07666098807495741,
		expectedAmount: 2980,
		expectedCritRate: 256,
		finalizedAmount: 3508.2779110051106,
		guessAmount: 3057.1384669751365,
		hitType: 1,
		multiplier: 1,
		simulated: true,
		sourceID: 2,
		sourceIsFriendly: true,
		targetID: 3,
		targetIsFriendly: false,
		targetResources: {
			absorb: 0,
			facing: -160,
			hitPoints: 66978953,
			maxHitPoints: 75722720,
			maxMP: 10000,
			maxTP: 1000,
			mp: 10000,
			tp: 0,
			x: 9999,
			y: 10081,
		},
		tick: true,
		timestamp: 8012166,
		type: 'damage',
		...fakeHitTypeFields,
	},
	{
		timestamp: 107453814,
		type: 'damage',
		sourceID: 2,
		sourceIsFriendly: true,
		targetID: 3,
		targetIsFriendly: false,
		ability: {
			name: 'Malefic IV',
			guid: 16555,
			type: 1024,
			abilityIcon: '003000-003555.png',
		},
		hitType: 1,
		amount: 21603,
		multiplier: 1.05,
		packetID: 18762,
		targetResources: {
			hitPoints: 73328677,
			maxHitPoints: 73350280,
			mp: 10000,
			maxMP: 10000,
			tp: 0,
			maxTP: 0,
			x: 10000,
			y: 9100,
			facing: -472,
			absorb: 0,
		},
		...fakeHitTypeFields,
	}],
	calculatedheal: [{
		timestamp: 7412071,
		type: 'calculatedheal',
		sourceID: 3,
		sourceIsFriendly: true,
		targetID: 3,
		targetIsFriendly: true,
		ability: {
			name: 'Assize',
			guid: 3571,
			type: 1024,
			abilityIcon: '002000-002634.png',
		},
		hitType: 2,
		amount: 36194,
		packetID: 4570,
		sourceResources: {
			hitPoints: 122214,
			maxHitPoints: 122214,
			mp: 9800,
			maxMP: 10000,
			tp: 0,
			maxTP: 1000,
			x: 9887,
			y: 10642,
			facing: -208,
			absorb: 0,
		},
		targetResources: {
			hitPoints: 122214,
			maxHitPoints: 122214,
			mp: 9800,
			maxMP: 10000,
			tp: 0,
			maxTP: 1000,
			x: 9887,
			y: 10642,
			facing: -208,
			absorb: 0,
		},
		...fakeHitTypeFields,
	}],
	heal: [{
		timestamp: 8586700,
		type: 'heal',
		sourceID: 11,
		sourceIsFriendly: true,
		targetID: 8,
		targetIsFriendly: true,
		ability: {
			name: 'Combined HoTs',
			guid: 500001,
			type: 1,
			abilityIcon: '000000-000405.png',
		},
		hitType: 1,
		amount: 4588,
		tick: true,
		targetResources: {
			hitPoints: 60545,
			maxHitPoints: 128026,
			mp: 9461,
			maxMP: 10000,
			tp: 0,
			maxTP: 1000,
			x: 10601,
			y: 9971,
			facing: -288,
			absorb: 0,
		},
		...fakeHitTypeFields,
	},
	{
		timestamp: 107457863,
		type: 'heal',
		sourceID: 1,
		sourceIsFriendly: true,
		targetID: 1,
		targetIsFriendly: true,
		ability: {
			name: 'Brutal Shell',
			guid: 16139,
			type: 128,
			abilityIcon: '003000-003403.png',
		},
		hitType: 1,
		amount: 0,
		overheal: 7670,
		packetID: 18799,
		targetResources: {
			hitPoints: 213022,
			maxHitPoints: 213022,
			mp: 10000,
			maxMP: 10000,
			tp: 0,
			maxTP: 0,
			x: 9996,
			y: 9999,
			facing: -783,
			absorb: 43,
		},
		...fakeHitTypeFields,
	}],
	begincast: [{
		timestamp: 7446878,
		type: 'begincast',
		sourceID: 9,
		sourceIsFriendly: true,
		targetID: 2,
		targetIsFriendly: false,
		ability: {
			name: 'Broil III',
			guid: 16541,
			type: 1024,
			abilityIcon: '002000-002821.png',
		},
	}],
	cast: [{
		timestamp: 7537601,
		type: 'cast',
		sourceID: 4,
		sourceIsFriendly: true,
		targetID: 2,
		targetIsFriendly: false,
		ability: {
			name: 'Brutal Shell',
			guid: 16139,
			type: 128,
			abilityIcon: '003000-003403.png',
		},
	}],
	applybuff: [{
		timestamp: 7537469,
		type: 'applybuff',
		sourceID: 11,
		sourceInstance: 2,
		sourceIsFriendly: true,
		targetID: 4,
		targetIsFriendly: true,
		ability: {
			name: 'Seraphic Veil',
			guid: 1001917,
			type: 8,
			abilityIcon: '012000-012848.png',
		},
	}],
	applydebuff: [{
		timestamp: 190177,
		type: 'applydebuff',
		sourceID: 6,
		sourceIsFriendly: true,
		targetID: 11,
		targetIsFriendly: false,
		ability: {
			name: 'Vulnerability Up',
			guid: 1000638,
			type: 1,
			abilityIcon: '015000-015020.png',
		},
	}],
	refreshbuff: [{
		timestamp: 7416935,
		type: 'refreshbuff',
		sourceID: 3,
		sourceIsFriendly: true,
		targetID: 3,
		targetIsFriendly: true,
		ability: {
			name: 'Temperance',
			guid: 1001873,
			type: 1,
			abilityIcon: '012000-012633.png',
		},
	}],
	refreshdebuff: [{
		timestamp: 7423728,
		type: 'refreshdebuff',
		sourceID: 8,
		sourceIsFriendly: true,
		targetID: 2,
		targetIsFriendly: false,
		ability: {
			name: 'Wildfire',
			guid: 1000861,
			type: 1,
			abilityIcon: '013000-013011.png',
		},
	}],
	removebuff: [{
		timestamp: 7735462,
		type: 'removebuff',
		sourceID: 1,
		sourceIsFriendly: true,
		targetID: 1,
		targetIsFriendly: true,
		ability: {
			name: 'Sword Oath',
			guid: 1001902,
			type: 1,
			abilityIcon: '019000-019461.png',
		},
	}],
	removedebuff: [{
		timestamp: 7427662,
		type: 'removedebuff',
		sourceID: 9,
		sourceIsFriendly: true,
		targetID: 2,
		targetIsFriendly: false,
		ability: {
			name: 'Chain Stratagem',
			guid: 1001221,
			type: 1,
			abilityIcon: '012000-012809.png',
		},
	}],
	applybuffstack: [{
		timestamp: 7410286,
		type: 'applybuffstack',
		sourceID: 7,
		sourceIsFriendly: true,
		targetID: 7,
		targetIsFriendly: true,
		ability: {
			name: 'Acceleration',
			guid: 1001238,
			type: 1,
			abilityIcon: '019000-019661.png',
		},
		stack: 2,
	}],
	applydebuffstack: [{
		timestamp: 7425207,
		type: 'applydebuffstack',
		sourceID: 8,
		sourceIsFriendly: true,
		targetID: 2,
		targetIsFriendly: false,
		ability: {
			name: 'Wildfire',
			guid: 1000861,
			type: 1,
			abilityIcon: '013000-013011.png',
		},
		stack: 2,
	}],
	removebuffstack: [{
		timestamp: 7410865,
		type: 'removebuffstack',
		sourceID: 7,
		sourceIsFriendly: true,
		targetID: 7,
		targetIsFriendly: true,
		ability: {
			name: 'Acceleration',
			guid: 1001238,
			type: 1,
			abilityIcon: '019000-019661.png',
		},
		stack: 1,
	}],
	removedebuffstack: [{
		timestamp: 431742760,
		type: 'removedebuffstack',
		sourceID: 4917,
		sourceIsFriendly: false,
		targetID: 4883,
		targetInstance: 14,
		targetIsFriendly: true,
		ability: {
			name: 'Summon Order II',
			guid: 1001964,
			type: 1,
			abilityIcon: '019000-019711.png',
		},
		stack: 1,
	}],
	targetabilityupdate: [{
		timestamp: 7906700,
		type: 'targetabilityupdate',
		sourceID: 20,
		sourceInstance: 7,
		sourceIsFriendly: false,
		targetID: 20,
		targetInstance: 7,
		targetIsFriendly: false,
		ability: {
			name: 'Unknown Ability',
			guid: 0,
			type: 0,
			abilityIcon: '000000-000405.png',
		},
		targetable: 1,
	}],
	death: [{
		timestamp: 502017,
		type: 'death',
		sourceID: 29,
		sourceInstance: 5,
		sourceIsFriendly: false,
		targetID: 8,
		targetIsFriendly: true,
		ability: {
			name: 'Unknown Ability',
			guid: 0,
			type: 0,
			abilityIcon: '000000-000405.png',
		},
	}],
	limitbreakupdate: [{
		...fakeBaseFields,
		bars: 3,
		timestamp: 8588751,
		type: 'limitbreakupdate',
		value: 220,
	}],
	checksummismatch: [{
		...fakeBaseFields,
		timestamp: 3206414,
		type: 'checksummismatch',
		data: 41298,
	}],
	zonechange: [{
		...fakeBaseFields,
		timestamp: 8240010,
		type: 'zonechange',
		zoneDifficulty: 0,
		zoneID: 840,
		zoneName: 'the Twinning',
	}],
	unknown: [{
		...fakeBaseFields,
		timestamp: 760647,
		type: 'unknown',
		ability: {
			abilityIcon: '002000-002629.png',
			guid: 139,
			name: 'Holy',
			type: 1024,
		},
	}],
	dispel: [{
		timestamp: 67561238,
		type: 'dispel',
		sourceID: 20,
		sourceInstance: 1,
		sourceIsFriendly: false,
		targetID: 806,
		targetIsFriendly: true,
		ability: {
			name: 'Fifth Element',
			guid: 14275,
			type: 1024,
			abilityIcon: '000000-000405.png',
		},
		extraAbility: {
			name: 'Third Eye',
			guid: 1001232,
			type: 8,
			abilityIcon: '013000-013307.png',
		},
		isBuff: false,
	}],
	wipecalled: [{
		timestamp: 100000000,
		type: 'wipecalled',
		sourceIsFriendly: true,
		targetIsFriendly: true,
	}],
	mapchange: [{
		...fakeBaseFields,
		timestamp: 1501472,
		type: 'mapchange',
		mapID: 668,
		mapName: 'Ego Collective C',
		mapFile: null,
	}],
	worldmarkerplaced: [{
		...fakeBaseFields,
		icon: 1,
		mapID: 599,
		timestamp: 7884556,
		type: 'worldmarkerplaced',
		x: 10004,
		y: 8025,
	}],
	worldmarkerremoved: [{
		...fakeBaseFields,
		icon: 1,
		timestamp: 7884556,
		type: 'worldmarkerremoved',
	}],
	instakill: [{
		ability: {name: 'Twister', guid: 9899, type: 1024, abilityIcon: '000000-000405.png'},
		// These fields don't actually exist on the event
		amount: Infinity,
		hitType: 0,
		// end
		sourceID: 1957,
		sourceInstance: 4,
		sourceIsFriendly: false,
		sourceResources: {
			absorb: 0,
			facing: -520,
			hitPoints: 57250,
			maxHitPoints: 57250,
			maxMP: 10000,
			maxTP: 1000,
			mp: 0,
			tp: 0,
			x: -631,
			y: -1583},
		targetID: 1951,
		targetIsFriendly: true,
		targetResources: {
			absorb: 0,
			facing: -562,
			hitPoints: 43259,
			maxHitPoints: 43259,
			maxMP: 10000,
			maxTP: 1000,
			mp: 9700,
			tp: 0,
			x: -588,
			y: -1535},
		timestamp: 51935589,
		type: 'instakill',
	}],
}

// #endregion

describe('Event adapter', () => {
	describe('individual events', () => {
		// Noop the reassign unknown actor step - the test data for individual events is intentionally
		// pulled directly out of real logcs, and as such will always be misaligned from the test report.
		class NoopStep extends AdapterStep {}
		beforeEach(() => {
			MockReassignUnknownActorStep.mockImplementation((...args: ReassignUnknownActorStepParams) => {
				return new NoopStep(...args) as ReassignUnknownActorStep
			})
		})

		Object.keys(fakeEvents).forEach(eventType => it(`adapts ${eventType}`, () => {
			for (const event of fakeEvents[eventType as keyof typeof fakeEvents]) {
				expect(adaptEvents(report, pull, [event])).toMatchSnapshot()
			}
		}))
	})

	it('sorts events with identical timestamps', () => {
		const result = adaptEvents(report, pull, [
			{...fakeEvents.applybuff[0], timestamp: 1},
			{...fakeEvents.cast[0], timestamp: 1},
			{...fakeEvents.begincast[0], timestamp: 1},
			{...fakeEvents.death[0], timestamp: 1},
		])

		expect(result.map(event => event.type)).toEqual([
			'actorUpdate',
			'prepare',
			'action',
			'statusApply',
		])
	})

	it('fabricates interrupts', () => {
		const interruptedAbility = (fakeEvents.begincast[0] as CastEvent).ability
		const interruptingAbility = {...interruptedAbility, guid: interruptedAbility.guid + 1}
		const interruptionTimestamp = 4

		const result = adaptEvents(report, pull, [
			{...fakeEvents.begincast[0], ability: interruptedAbility, sourceID: 1, timestamp: 1} as CastEvent,
			{...fakeEvents.begincast[0], ability: interruptedAbility, sourceID: 2, timestamp: 1} as CastEvent,
			{...fakeEvents.cast[0], ability: interruptedAbility, sourceID: 1, timestamp: 2} as CastEvent,

			{...fakeEvents.begincast[0], ability: interruptedAbility, sourceID: 1, timestamp: 3} as CastEvent,
			{...fakeEvents.begincast[0], ability: interruptingAbility, sourceID: 1, timestamp: interruptionTimestamp} as CastEvent,
		])

		expect(result.map(event => event.type)).toEqual([
			'actorUpdate', // injected actor update with stats
			'prepare', // regular cast sequence from actor 1
			'prepare', // prep from actor 2, should not effect actor 1
			'action',
			'prepare', // interrupted cast from actor 1
			'interrupt',
			'prepare',
		])
		expect(result[5] as Events['interrupt']).toEqual({
			type: 'interrupt',
			timestamp: timestamp + interruptionTimestamp,
			source: '1',
			target: '1',
			action: interruptedAbility.guid,
		})
	})

	it('synthesizes prepull actions', () => {
		// simulating a begincast before the event that should trip the prepull, to ensure
		// prepull is added before _all_ events, not just the start of the adapted base.
		const result = adaptEvents(report, pull, [
			fakeEvents.begincast[0],
			fakeEvents.calculateddamage[0],
		])
		expect(result.map(event => event.type)).toEqual([
			'action', // prepull synth
			'prepare', // begincast
			'damage', // calculateddamage
			'actorUpdate',
			'actorUpdate',
		])
	})

	it('synthesizes prepull status-applying actions', () => {
		// simulating a begincast before the event that should trip the prepull, to ensure
		// prepull is added before _all_ events, not just the start of the adapted base.
		const result = adaptEvents(report, pull, [
			{...fakeEvents.begincast[0], timestamp: 1},
			{
				timestamp: 2,
				type: 'applybuff',
				sourceID: 11,
				sourceInstance: 2,
				sourceIsFriendly: true,
				targetID: 4,
				targetIsFriendly: true,
				ability: {
					name: 'Raging Strikes',
					guid: 1000125,
					type: 8,
					abilityIcon: '012000-012848.png',
				},
			},
		])
		expect(result.map(event => event.type)).toEqual([
			'action', // prepull synth
			'prepare', // begincast
			'statusApply', // applybuff
		])
	})

	it('synthesizes prepull status applications', () => {
		// simulating a begincast before the event that should trip the prepull, to ensure
		// prepull is added before _all_ events, not just the start of the adapted base.
		const result = adaptEvents(report, pull, [
			fakeEvents.begincast[0],
			fakeEvents.removebuff[0],
		])
		expect(result.map(event => event.type)).toEqual([
			'action', // prepull synth
			'statusApply', // prepull synth
			'prepare', // begincast
			'statusRemove', // removebuff
		])
	})

	it('merges duplicate status data', () => {
		const statusData = 10

		const result = adaptEvents(report, pull, [{
			timestamp: 100,
			type: 'applybuff',
			sourceID: 1,
			sourceIsFriendly: true,
			targetID: 2,
			targetIsFriendly: true,
			ability: fakeAbility,
		}, {
			timestamp: 100,
			type: 'applybuffstack',
			sourceID: 1,
			sourceIsFriendly: true,
			targetID: 2,
			targetIsFriendly: true,
			ability: fakeAbility,
			stack: statusData,
		}])

		expect(result).toHaveLength(1)
		expect(result[0].type).toBe('statusApply')
		expect((result[0] as Events['statusApply']).data).toBe(statusData)
	})

	it('omits duplicate actor data', () => {
		const sharedFields = {
			...fakeHitTypeFields,
			...fakeBaseFields,
			type: 'calculateddamage',
			targetID: 1,
			sourceID: 2,
			hitType: HitType.NORMAL,
			amount: 100,
			ability: fakeAbility,
		} as const

		const sharedResources = {
			hitPoints: 100,
			maxHitPoints: 1000,
			mp: 100,
			maxMP: 10000,
			tp: 0,
			maxTP: 0,
			x: 100,
			y: 100,
			facing: 0,
		}

		const result = adaptEvents(report, pull, [{
			...sharedFields,
			timestamp: 100,
			targetResources: sharedResources,
		}, {
			...sharedFields,
			timestamp: 200,
			targetResources: {
				...sharedResources,
				hitPoints: 200,
			},
		}, {
			...sharedFields,
			timestamp: 300,
			targetResources: {
				...sharedResources,
				hitPoints: 200,
				mp: 300,
				maxMP: 15000,
				x: 150,
				y: 50,
			},
		}])

		const updates = result.filter(event => true
			&& event.type === 'actorUpdate'
			&& event.actor === '1'
		)

		/* eslint-disable @typescript-eslint/no-magic-numbers */
		expect(updates).toEqual([{
			timestamp: timestamp + 100,
			type: 'actorUpdate',
			actor: '1',
			hp: {current: 100, maximum: 1000},
			mp: {current: 100, maximum: 10000},
			position: {x: 100, y: 100, bearing: 0},
		}, {
			timestamp: timestamp + 200,
			type: 'actorUpdate',
			actor: '1',
			hp: {current: 200},
		}, {
			timestamp: timestamp + 300,
			type: 'actorUpdate',
			actor: '1',
			mp: {current: 300, maximum: 15000},
			position: {x: 150, y: 50},
		}])
		/* eslint-enable @typescript-eslint/no-magic-numbers */
	})
})
