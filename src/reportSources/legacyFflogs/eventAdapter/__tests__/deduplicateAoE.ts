import {GameEdition} from 'data/EDITIONS'
import {Cause, Event, Events, SourceModifier, TargetModifier} from 'event'
import {Actor, Pull, Report, Team} from 'report'
import {ReportLanguage} from 'reportSources/legacyFflogs/eventTypes'
import {DeduplicateAoEStep} from '../deduplicateAoE'

const actor: Actor = {
	id: '1',
	kind: '1',
	name: 'Test Actor',
	team: Team.FRIEND,
	playerControlled: true,
	job: 'UNKNOWN',
}

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

const eventAttrs : { cause: Cause, source: string }= {
	cause: {
		type: 'action',
		action: 1,
	},
	source: 's1',
}

const damageTargetAttrs = {
	amount: 1,
	overkill: 0,
	sourceModifier: SourceModifier.NORMAL,
	targetModifier: TargetModifier.NORMAL,
	bonusPercent: 0,
}

const healTargetAttrs = {
	amount: 1,
	overheal: 0,
	sourceModifier: SourceModifier.NORMAL,
}

function ensureOrder(timestamps: number[]): void {
	for (let i = 0; i < timestamps.length; i++) {
		if (i === 0) {
			continue
		}
		if (timestamps[i] < timestamps[i - 1]) {
			fail()
		}
	}
}

describe('DeduplicateAoEStep', () => {
	let step: DeduplicateAoEStep
	beforeEach(() => {
		step = new DeduplicateAoEStep({
			report,
			pull,
		})
	})
	describe('#postprocess', () => {
		describe('when dealing with damage events', () => {
			const events: Event[] = [
				{
					type: 'damage',
					...eventAttrs,
					timestamp: 1,
					sequence: 1,
					targets: [{
						target: 't1',
						...damageTargetAttrs,
					}],
				},
				{
					type: 'damage',
					...eventAttrs,
					timestamp: 1,
					sequence: 1,
					targets: [{
						target: 't2',
						...damageTargetAttrs,
					}],
				},
				{
					type: 'damage',
					...eventAttrs,
					timestamp: 2,
					targets: [{
						target: 't1',
						...damageTargetAttrs,
					}],
				},
				{
					type: 'damage',
					...eventAttrs,
					timestamp: 2,
					targets: [{
						target: 't2',
						...damageTargetAttrs,
					}],
				},
			]

			it('deduplicates damage events', () => {
				const results = step.postprocess(events)

				// eslint-disable-next-line @typescript-eslint/no-magic-numbers
				expect(results.length).toEqual(3)
				expect((results[0] as Events['damage']).targets.length).toEqual(2)
			})
			it('does not deduplicate DoT events', () => {
				const results = step.postprocess(events)

				expect(results.filter(e => (e as Events['damage']).sequence != null).length).toEqual(1)
			})
			it('retains order of events', () => {
				const results = step.postprocess(events)

				ensureOrder(results.map(e => e.timestamp))
			})
		})

		describe('when dealing with heal events', () => {
			const events: Event[] = [
				{
					type: 'heal',
					...eventAttrs,
					timestamp: 1,
					sequence: 1,
					targets: [{
						target: 't1',
						...healTargetAttrs,
					}],
				},
				{
					type: 'heal',
					...eventAttrs,
					timestamp: 1,
					sequence: 1,
					targets: [{
						target: 't2',
						...healTargetAttrs,
					}],
				},
				{
					type: 'heal',
					...eventAttrs,
					timestamp: 2,
					targets: [{
						target: 't1',
						...healTargetAttrs,
					}],
				},
				{
					type: 'heal',
					...eventAttrs,
					timestamp: 2,
					targets: [{
						target: 't1',
						...healTargetAttrs,
					}],
				},
			]
			it('deduplicates heal events', () => {
				const results = step.postprocess(events)

				// eslint-disable-next-line @typescript-eslint/no-magic-numbers
				expect(results.length).toEqual(3)
				expect((results[0] as Events['heal']).targets.length).toEqual(2)
			})
			it('does not deduplicate HoT events', () => {
				const results = step.postprocess(events)

				expect(results.filter(e => (e as Events['heal']).sequence != null).length).toEqual(1)
			})
			it('retains order of events', () => {
				const results = step.postprocess(events)

				ensureOrder(results.map(e => e.timestamp))
			})
		})

		describe('when dealing with neither damage nor heal events', () => {
			const events: Event[] = [
				{
					type: 'execute',
					timestamp: 1,
					source: 's1',
					target: 't1',
					action: 1,
					sequence: 1,
				},
				{
					type: 'execute',
					timestamp: 1,
					source: 's1',
					target: 't2',
					action: 1,
					sequence: 1,
				},
				{
					type: 'execute',
					timestamp: 2,
					source: 's1',
					target: 't1',
					action: 1,
					sequence: 2,
				},
			]

			it('does not deduplicate events', () => {
				const results = step.postprocess(events)
				// eslint-disable-next-line @typescript-eslint/no-magic-numbers
				expect(results.length).toEqual(3)
			})
			it('retains order of events', () => {
				const results = step.postprocess(events)
				ensureOrder(results.map(e => e.timestamp))
			})
		})
	})
})
