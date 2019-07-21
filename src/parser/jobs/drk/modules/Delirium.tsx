import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import _ from 'lodash'
import Module, {dependency} from 'parser/core/Module'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import Timeline from 'parser/core/modules/Timeline'
import React from 'react'

const DELIRIUM_DURATION = 10000

const BLOOD_SKILLS = [
	ACTIONS.BLOODSPILLER.id,
	ACTIONS.QUIETUS.id, // obvious caveat - only on >1 target
]

const EXPECTED_CONSTANTS = {
	GCD: 5,
	BLOOD_SKILLS: 5,
}

const SEVERITY_MISSED_GCDS = {
	1: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

const SEVERITY_MISSED_BLOOD_SKILLS = {
	1: SEVERITY.MEDIUM,
	2: SEVERITY.MAJOR,
}

class DeliriumState {
	start: number
	end?: number
	rotation: CastEvent[] = []
	isRushing: boolean = false // TODO: Actually use this, and display it appropriately in the output table

	constructor(start: number) {
		this.start = start
	}

	get bloodSkills(): number {
		return this.rotation
			.filter(e => BLOOD_SKILLS.includes(e.ability.guid))
			.length
	}

	get gcds(): number {
		return this.rotation
			.map(e => getDataBy(ACTIONS, 'id', e.ability.guid) as TODO)
			.filter(a => a && a.onGcd)
			.length
	}
}

export default class Delirium extends Module {
	static handle = 'delirium'
	static title = t('drk.delirium.title')`Delirium Usage`

	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline

	// Inner Release Windows
	private deliriumWindows: DeliriumState[] = []

	private get lastDelirium(): DeliriumState | undefined {
		return _.last(this.deliriumWindows)
	}

	protected init() {
		this.addHook('cast', {by: 'player'}, this.onCast)
		this.addHook(
			'removebuff',
			{by: 'player', abilityId: STATUSES.DELIRIUM.id},
			this.onRemoveDelirium,
		)
		this.addHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent) {
		const actionId = event.ability.guid

		if (actionId === ACTIONS.ATTACK.id) {
			return
		}

		if (actionId === ACTIONS.DELIRIUM.id) {
			const delirium = new DeliriumState(event.timestamp)
			const fightTimeRemaining = this.parser.fight.end_time - event.timestamp
			delirium.isRushing = DELIRIUM_DURATION >= fightTimeRemaining

			this.deliriumWindows.push(delirium)
		}

		// So long as we're in this window, log our actions to it.
		const lastDelirium = this.lastDelirium
		if (lastDelirium != null && lastDelirium.end == null) {
			lastDelirium.rotation.push(event)
		}
	}

	private onRemoveDelirium(event: BuffEvent) {
		const lastDelirium = this.lastDelirium

		if (lastDelirium != null) {
			lastDelirium.end = event.timestamp
		}
	}

	private onComplete() {
		const missedGcds = this.deliriumWindows
			.reduce((sum, deliriumWindow) => sum + Math.max(0, EXPECTED_CONSTANTS.GCD - deliriumWindow.gcds), 0)
		const missedBloodSkills = this.deliriumWindows
			.reduce((sum, deliriumWindow) => sum + Math.max(0, deliriumWindow.gcds - deliriumWindow.bloodSkills), 0)

		// missed GCDs
		if (missedGcds > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.DELIRIUM.icon,
				content: <Trans id="drk.delirium.suggestions.missedgcd.content">
					Try to land 5 GCDs during every <ActionLink {...ACTIONS.DELIRIUM}/> window. If you cannot do this with full uptime and no clipping, consider adjusting your gearset for more Skill Speed.
				</Trans>,
				tiers: SEVERITY_MISSED_GCDS,
				value: missedGcds,
				why: <Trans id="drk.delirium.suggestions.missedgcd.why">
					{missedGcds} <Plural value={missedGcds} one="GCD was" other="GCDs were"/> missed during Delirium windows.
				</Trans>,
			}))
		}

		// incorrect GCDs (not Blood skills)
		if (missedBloodSkills > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.BLOODSPILLER.icon,
				content: <Trans id="drk.delirium.suggestions.badgcd.content">
					GCDs used during <ActionLink {...ACTIONS.DELIRIUM}/> should be limited to <ActionLink {...ACTIONS.BLOODSPILLER}/> for optimal damage (or <ActionLink {...ACTIONS.QUIETUS}/> if three or more targets are present).
				</Trans>,
				tiers: SEVERITY_MISSED_BLOOD_SKILLS,
				value: missedBloodSkills,
				why: <Trans id="drk.delirium.suggestions.badgcd.why">
					{missedBloodSkills} incorrect <Plural value={missedBloodSkills} one="GCD was" other="GCDs were"/> used during Delirium windows.
				</Trans>,
			}))
		}
	}

	output() {
		return <RotationTable
			targets={[
				{
					header: <Trans id="drk.delirium.table.header.gcds">GCDs</Trans>,
					accessor: 'gcd',
				},
				{
					header: <ActionLink showName={false} {...ACTIONS.BLOODSPILLER}/>,
					accessor: 'bloodSkills',
				},
			]}
			data={this.deliriumWindows
				.map(deliriumWindow => ({
					start: deliriumWindow.start - this.parser.fight.start_time,
					end: deliriumWindow.end != null ?
						deliriumWindow.end - this.parser.fight.start_time
						: deliriumWindow.start - this.parser.fight.start_time,
					targetsData: {
						gcd: {
							actual: deliriumWindow.gcds,
							expected: EXPECTED_CONSTANTS.GCD,
						},
						bloodSkills: {
							actual: deliriumWindow.bloodSkills,
							expected: EXPECTED_CONSTANTS.BLOOD_SKILLS,
						},
					},
					rotation: deliriumWindow.rotation,
				}))
			}
			onGoto={this.timeline.show}
		/>
	}

}
