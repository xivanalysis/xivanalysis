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
import Suggestions, {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import Timeline from 'parser/core/modules/Timeline'
import React from 'react'

const IR_DURATION = 10000

const GAUGE_DUMPS = [
	ACTIONS.FELL_CLEAVE.id,
	ACTIONS.DECIMATE.id, // obvious caveat - only on >1 target
]

const EXPECTED_CONSTANTS = {
	UPHEAVAL: 1,
	ONSLAUGHT: 1,
	GCD: 5,
	GAUGE_DUMP: 5,
}

class InnerReleaseState {
	start: number
	end: number | null = null
	rotation: CastEvent[] = []
	isRushing: boolean = false // TODO: Actually use this, and display it appropriately in the output table

	constructor(start: number) {
		this.start = start
	}

	get gaugeDumps(): number {
		return this.rotation
			.filter(e => GAUGE_DUMPS.includes(e.ability.guid))
			.length
	}

	get gcds(): number {
		return this.rotation
			.map(e => getDataBy(ACTIONS, 'id', e.ability.guid) as TODO)
			.filter(a => a && a.onGcd)
			.length
	}

	get upheavals(): number {
		return this.rotation
			.filter(e => e.ability.guid === ACTIONS.UPHEAVAL.id)
			.length
	}

	get onslaughts(): number {
		return this.rotation
			.filter(e => e.ability.guid === ACTIONS.ONSLAUGHT.id)
			.length
	}
}

export default class InnerRelease extends Module {
	static handle = 'ir'
	static title = t('war.ir.title')`Inner Release Usage`

	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline

	// Inner Release Windows
	private innerReleaseWindows: InnerReleaseState[] = []

	private get lastInnerRelease(): InnerReleaseState | undefined {
		return _.last(this.innerReleaseWindows)
	}

	protected init() {
		this.addHook('cast', {by: 'player'}, this.onCast)
		this.addHook(
			'removebuff',
			{by: 'player', abilityId: STATUSES.INNER_RELEASE.id},
			this.onRemoveInnerRelease,
		)
		this.addHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent) {
		const actionId = event.ability.guid

		if (actionId === ACTIONS.ATTACK.id) {
			return
		}

		if (actionId === ACTIONS.INNER_RELEASE.id) {
			const innerRelease = new InnerReleaseState(event.timestamp)
			const fightTimeRemaining = this.parser.fight.end_time - event.timestamp
			innerRelease.isRushing = IR_DURATION >= fightTimeRemaining

			this.innerReleaseWindows.push(innerRelease)
		}

		// So long as we're in this window, log our actions to it.
		const lastInnerRelease = this.lastInnerRelease
		if (lastInnerRelease != null && lastInnerRelease.end == null) {
			lastInnerRelease.rotation.push(event)
		}
	}

	private onRemoveInnerRelease(event: BuffEvent) {
		const lastInnerRelease = this.lastInnerRelease

		if (lastInnerRelease != null) {
			lastInnerRelease.end = event.timestamp
		}
	}

	private onComplete() {
		const missedGcds = this.innerReleaseWindows
			.reduce((sum, irWindow) => sum + Math.max(0, EXPECTED_CONSTANTS.GCD - irWindow.gcds), 0)
		const missedGaugeDumps = this.innerReleaseWindows
			.reduce((sum, irWindow) => sum + Math.max(0, irWindow.gcds - irWindow.gaugeDumps), 0)
		const missedUpheavals = this.innerReleaseWindows
			.reduce((sum, irWindow) => sum + Math.max(0, EXPECTED_CONSTANTS.UPHEAVAL - irWindow.upheavals), 0)
		const missedOnslaughts = this.innerReleaseWindows
			.reduce((sum, irWindow) => sum + Math.max(0, EXPECTED_CONSTANTS.ONSLAUGHT - irWindow.onslaughts), 0)

		// missed GCDs
		if (missedGcds > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.INNER_RELEASE.icon,
				content: <Trans id="war.ir.suggestions.missedgcd.content">
					Try to land 5 GCDs during every <ActionLink {...ACTIONS.INNER_RELEASE}/> window. If you cannot do this with full uptime and no clipping, consider adjusting your gearset for more Skill Speed.
				</Trans>,
				why: <Trans id="war.ir.suggestions.missedgcd.why">
					{missedGcds} <Plural value={missedGcds} one="GCD was" other="GCDs were"/> missed inside of <ActionLink {...ACTIONS.INNER_RELEASE}/> windows.
				</Trans>,
				severity: SEVERITY.MAJOR,
			}))
		}

		// incorrect GCDs (not Fell Cleave or Decimate)
		if (missedGaugeDumps > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.FELL_CLEAVE.icon,
				content: <Trans id="war.ir.suggestions.badgcd.content">
					GCDs used during <ActionLink {...ACTIONS.INNER_RELEASE}/> should be limited to <ActionLink {...ACTIONS.FELL_CLEAVE}/> for optimal damage (or <ActionLink {...ACTIONS.DECIMATE}/> if three or more targets are present).
				</Trans>,
				why: <Trans id="war.ir.suggestions.badgcd.why">
					{missedGaugeDumps} incorrect <Plural value={missedGaugeDumps} one="GCD was" other="GCDs were"/> used during <ActionLink {...ACTIONS.INNER_RELEASE}/> windows.
				</Trans>,
				severity: SEVERITY.MAJOR,
			}))
		}

		// missed oGCDs
		if (missedUpheavals > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.UPHEAVAL.icon,
				// TODO: check if plural lets me embed ActionLink
				content: <Trans id="war.ir.suggestions.upheaval.content">
					One use of <ActionLink {...ACTIONS.UPHEAVAL}/> should occur during every <ActionLink {...ACTIONS.INNER_RELEASE}/> window.
				</Trans>,
				why: <Trans id="war.ir.suggestions.upheaval.why">
					{missedUpheavals} <Plural value={missedUpheavals} one="use of" other="uses of"/> <ActionLink {...ACTIONS.UPHEAVAL}/> <Plural value={missedUpheavals} one="was" other="were"/> missed during <ActionLink {...ACTIONS.INNER_RELEASE}/> windows.
				</Trans>,
				severity: SEVERITY.MAJOR,
			}))
		}

		if (missedOnslaughts > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.ONSLAUGHT.icon,
				// TODO: check if plural lets me embed ActionLink
				content: <Trans id="war.ir.suggestions.onslaught.content">
					One use of <ActionLink {...ACTIONS.ONSLAUGHT}/> should occur during every <ActionLink {...ACTIONS.INNER_RELEASE}/> window.
				</Trans>,
				why: <Trans id="war.ir.suggestions.onslaught.why">
					{missedOnslaughts} <Plural value={missedOnslaughts} one="use of" other="uses of"/> <ActionLink {...ACTIONS.ONSLAUGHT}/> <Plural value={missedOnslaughts} one="was" other="were"/> missed during <ActionLink {...ACTIONS.INNER_RELEASE}/> windows.
				</Trans>,
				severity: SEVERITY.MEDIUM,
			}))
		}
	}

	output() {
		return <RotationTable
			targets={[
				{
					header: <Trans id="war.ir.table.header.gcds">GCDs</Trans>,
					accessor: 'gcd',
				},
				{
					header: <ActionLink showName={false} {...ACTIONS.FELL_CLEAVE}/>,
					accessor: 'gaugeDump',
				},
				{
					header: <ActionLink showName={false} {...ACTIONS.UPHEAVAL}/>,
					accessor: 'upheaval',
				},
				{
					header: <ActionLink showName={false} {...ACTIONS.ONSLAUGHT}/>,
					accessor: 'onslaught',
				},
			]}
			data={this.innerReleaseWindows
				.map(irWindow => ({
					start: irWindow.start - this.parser.fight.start_time,
					end: irWindow.end != null ?
						irWindow.end - this.parser.fight.start_time
						: irWindow.start - this.parser.fight.start_time,
					targetsData: {
						gcd: {
							actual: irWindow.gcds,
							expected: EXPECTED_CONSTANTS.GCD,
						},
						gaugeDump: {
							actual: irWindow.gaugeDumps,
							expected: EXPECTED_CONSTANTS.GAUGE_DUMP,
						},
						upheaval: {
							actual: irWindow.upheavals,
							expected: EXPECTED_CONSTANTS.UPHEAVAL,
						},
						onslaught: {
							actual: irWindow.onslaughts,
							expected: EXPECTED_CONSTANTS.ONSLAUGHT,
						},
					},
					rotation: irWindow.rotation,
				}))
			}
			onGoto={this.timeline.show}
		/>
	}

}
