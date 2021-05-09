import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Rule, Requirement} from 'parser/core/modules/Checklist'
import Combatants from 'parser/core/modules/Combatants'
import {Data} from 'parser/core/modules/Data'
import {EntityStatuses} from 'parser/core/modules/EntityStatuses'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {NormalisedDamageEvent} from 'parser/core/modules/NormalisedEvents'
import {PieChartStatistic, Statistics} from 'parser/core/modules/Statistics'
import Suggestions, {Suggestion, TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const BAD_LIFE_SURGE_CONSUMERS: number[] = [
	ACTIONS.TRUE_THRUST.id,
	ACTIONS.RAIDEN_THRUST.id,
	ACTIONS.VORPAL_THRUST.id,
	ACTIONS.DISEMBOWEL.id,
	ACTIONS.CHAOS_THRUST.id,
	ACTIONS.PIERCING_TALON.id,
	ACTIONS.DOOM_SPIKE.id,
	ACTIONS.SONIC_THRUST.id,
]

const FINAL_COMBO_HITS: number[] = [
	ACTIONS.FANG_AND_CLAW.id,
	ACTIONS.WHEELING_THRUST.id,
]

// these are the consumers we care to show in the chart
const CHART_LIFE_SURGE_CONSUMERS: number[] = [
	ACTIONS.FULL_THRUST.id,
	ACTIONS.FANG_AND_CLAW.id,
	ACTIONS.WHEELING_THRUST.id,
	ACTIONS.COERTHAN_TORMENT.id,
]

const CHART_COLORS: {[actionId: number]: string} = {
	[ACTIONS.FULL_THRUST.id]: '#0e81f7',
	[ACTIONS.FANG_AND_CLAW.id]: '#b36b00',
	[ACTIONS.WHEELING_THRUST.id]: '#b36b00',
	[ACTIONS.COERTHAN_TORMENT.id]: '#b36b00',
}

const OTHER_ACTION_COLOR: string = '#660000'
const MIN_COT_HITS: number = 3

export default class Buffs extends Module {
	static handle = 'buffs'
	static title = t('drg.buffs.title')`Buffs`

	private badLifeSurges: number = 0
	private fifthGcd: boolean = false
	private soloDragonSight: boolean = false
	private lifeSurgeCasts: number[] = []

	@dependency private checklist!: Checklist
	@dependency private combatants!: Combatants
	@dependency private entityStatuses!: EntityStatuses
	@dependency private invulnerability!: Invulnerability
	@dependency private suggestions!: Suggestions
	@dependency private data!: Data
	@dependency private statistics!: Statistics

	init() {
		this.addEventHook('cast', {by: 'player'}, this.onCast)
		this.addEventHook('complete', this.onComplete)
		this.addEventHook('applybuff', {by: 'player', abilityId: STATUSES.RIGHT_EYE_SOLO.id}, () => this.soloDragonSight = true)
		this.addEventHook('normaliseddamage', {by: 'player', abilityId: ACTIONS.COERTHAN_TORMENT.id}, this.onCot)
	}

	private onCast(event: CastEvent) {
		const action = this.data.getAction(event.ability.guid)
		if (action && action.onGcd) {
			// always mark consumed buff for stat chart
			if (this.combatants.selected.hasStatus(STATUSES.LIFE_SURGE.id)) {
				this.lifeSurgeCasts.push(action.id)
			}

			// 4-5 combo hit checks
			if (BAD_LIFE_SURGE_CONSUMERS.includes(action.id)) {
				this.fifthGcd = false // Reset the 4-5 combo hit flag on other GCDs
				if (this.combatants.selected.hasStatus(STATUSES.LIFE_SURGE.id)) {
					this.badLifeSurges++
				}
			} else if (FINAL_COMBO_HITS.includes(action.id)) {
				if (!this.fifthGcd) {
					// If we get 2 of these in a row (4-5 combo hits), only the first one is considered bad, so set a flag to ignore the next one
					this.fifthGcd = true
					if (this.combatants.selected.hasStatus(STATUSES.LIFE_SURGE.id)) {
						this.badLifeSurges++
					}
				}
			}
		}
	}

	private onCot(event: NormalisedDamageEvent) {
		// this action is pushed onto the statistic graph data by onCast, don't duplicate that
		// if coerthan torment is life surged and hits less than three targets, it's no good
		if (this.combatants.selected.hasStatus(STATUSES.LIFE_SURGE.id) && event.hitCount < MIN_COT_HITS) {
			this.badLifeSurges++
		}
	}

	private getDisembowelUptimePercent() {
		const statusUptime = this.entityStatuses.getStatusUptime(STATUSES.DISEMBOWEL.id, this.combatants.getEntities())
		const fightUptime = this.parser.currentDuration - this.invulnerability.getDuration({types: ['invulnerable']})
		return (statusUptime / fightUptime) * 100
	}

	private onComplete() {
		this.checklist.add(new Rule({
			name: <Trans id="drg.buffs.checklist.name">Keep {ACTIONS.DISEMBOWEL.name} up</Trans>,
			description: <Trans id="drg.buffs.checklist.description">
				<ActionLink {...ACTIONS.DISEMBOWEL}/> provides a 10% boost to your personal damage and should always be kept up.
			</Trans>,
			displayOrder: DISPLAY_ORDER.DISEMBOWEL,
			requirements: [
				new Requirement({
					name: <Trans id="drg.buffs.checklist.requirement.name"><ActionLink {...ACTIONS.DISEMBOWEL}/> uptime</Trans>,
					percent: () => this.getDisembowelUptimePercent(),
				}),
			],
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.LIFE_SURGE.icon,
			content: <Trans id="drg.buffs.suggestions.life-surge.content">
				<ActionLink {...ACTIONS.LIFE_SURGE}/> should be used on <ActionLink {...ACTIONS.FULL_THRUST}/>, your highest potency ability, as much as possible. In order to keep <ActionLink {...ACTIONS.LIFE_SURGE} /> on cooldown, it may sometimes be necessary to use it on a 5th combo hit. In multi-target scenarios, <ActionLink {...ACTIONS.LIFE_SURGE} /> can be used on <ActionLink {...ACTIONS.COERTHAN_TORMENT} /> if you hit at least three targets.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				4: SEVERITY.MAJOR,
			},
			value: this.badLifeSurges,
			why: <Trans id="drg.buffs.suggestions.life-surge.why">
				You used {ACTIONS.LIFE_SURGE.name} on a non-optimal GCD <Plural value={this.badLifeSurges} one="# time" other="# times"/>.
			</Trans>,
		}))

		if (this.soloDragonSight) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DRAGON_SIGHT.icon,
				content: <Trans id="drg.buffs.suggestions.solo-ds.content">
					Although it doesn't impact your personal DPS, try to always use <ActionLink {...ACTIONS.DRAGON_SIGHT} /> on a partner in group content so that someone else can benefit from the damage bonus too.
				</Trans>,
				severity: SEVERITY.MINOR,
				why: <Trans id="drg.buffs.suggestions.solo-ds.why">
					At least 1 of your Dragon Sight casts didn't have a tether partner.
				</Trans>,
			}))
		}

		// make a lil graph of life surge uses
		// get total LS casts
		const totalLsCasts = this.lifeSurgeCasts.length

		// format for graph
		const data = []

		// count the things we care about (total - tracked should usually equal bad LS uses)
		let trackedCastCount = 0
		for (const actionId of CHART_LIFE_SURGE_CONSUMERS) {
			const value = this.lifeSurgeCasts.filter(i => actionId === i).length

			// don't put 0s in the chart
			if (value === 0) { continue }

			data.push({
				value,
				color: CHART_COLORS[actionId],
				columns: [
					this.data.getAction(actionId)?.name,
					value,
					this.lsCastPercent(value, totalLsCasts),
				] as const,
			})

			trackedCastCount += value
		}

		// push other column if bad use
		const otherCasts = totalLsCasts - trackedCastCount
		if (otherCasts > 0) {
			data.push({
				value: otherCasts,
				color: OTHER_ACTION_COLOR,
				columns: [
					'Other',
					otherCasts,
					this.lsCastPercent(otherCasts, totalLsCasts),
				] as const,
			})
		}

		if (data.length > 0) {
			this.statistics.add(new PieChartStatistic({
				headings: ['Life Surge Consumer', 'Count', '%'],
				data,
			}))
		}
	}

	private lsCastPercent(value: number, total: number): string {
		return ((value / total) * 100).toFixed(2) + '%'
	}
}
