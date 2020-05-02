import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import _ from 'lodash'
import React from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module, {dependency} from 'parser/core/Module'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'

import {getDataBy} from 'data'
import {BuffEvent, CastEvent} from 'fflogs'

const SEVERITIES = {
	MISSING_EXPECTED_USES: {
		1: SEVERITY.MINOR,
		4: SEVERITY.MEDIUM,
		8: SEVERITY.MAJOR,
	},
	TOO_FEW_GCDS: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	},
}

const EXPECTED_USES = {
	GNASHING_FANG: 1,
	SONIC_BREAK: 1,
	ROUGH_DIVIDE: 1,
	BLASTING_ZONE: 1,
	BOW_SHOCK: 1,
	GCD: 9,

	// Don't check for correct Continuations; that will be covered by the Continuation module.
	// Don't check for correctness on the Gnashing Fang combo; that's covered by the built-in Combo tracker.
}

const NO_MERCY_BUFF_DURATION = 20000 // in milliseconds

class NoMercyState {
	start: number
	end?: number
	rotation: CastEvent[] = []
	isRushing: boolean = false

	// Track these for pre-processing so we don't have to loop back over this
	// a bunch of times later.
	numGcds: number = 0
	numBlastingZones: number = 0
	numSonicBreaks: number = 0
	numRoughDivides: number = 0
	numGnashingFangs: number = 0
	numBowShocks: number = 0

	constructor(start: number) {
		this.start = start
	}
}

export default class NoMercy extends Module {
	static handle = 'nomercy'
	static title = t('gnb.nomercy.title')`No Mercy Windows`

	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline

	private noMercyWindows: NoMercyState[] = []

	private get lastNoMercy(): NoMercyState | undefined {
		return _.last(this.noMercyWindows)
	}

	protected init() {
		this.addEventHook('cast', {by: 'player'}, this.onCast)
		this.addEventHook(
			'removebuff',
			{
				by: 'player',
				to: 'player',
				abilityId: [STATUSES.NO_MERCY.id],
			},
			this.onRemoveNoMercy,
		)
		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent) {
		const actionId = event.ability.guid

		if (actionId === ACTIONS.ATTACK.id) {
			return
		}

		if (actionId === ACTIONS.NO_MERCY.id) {
			const noMercyState = new NoMercyState(event.timestamp)
			const fightTimeRemaining = this.parser.fight.end_time - event.timestamp
			noMercyState.isRushing = NO_MERCY_BUFF_DURATION >= fightTimeRemaining

			this.noMercyWindows.push(noMercyState)
		}

		// So long as we're in this window, log our actions to it.
		const lastNoMercy = this.lastNoMercy
		if (lastNoMercy != null && lastNoMercy.end == null) {
			lastNoMercy.rotation.push(event)

			const action = getDataBy(ACTIONS, 'id', actionId) as TODO
			if (!action) { return }

			// Pre-process on the number of certain things we did
			if (action.onGcd) {
				lastNoMercy.numGcds++
			}

			switch (actionId) {
				// Blasting Zone is just a traited version of Danger Zone
				// Impossible to see both in the same log outside of hacking
				case ACTIONS.BLASTING_ZONE.id:
				case ACTIONS.DANGER_ZONE.id:
					lastNoMercy.numBlastingZones++
					break
				case ACTIONS.SONIC_BREAK.id:
					lastNoMercy.numSonicBreaks++
					break
				case ACTIONS.ROUGH_DIVIDE.id:
					lastNoMercy.numRoughDivides++
					break
				case ACTIONS.GNASHING_FANG.id:
					lastNoMercy.numGnashingFangs++
					break
				case ACTIONS.BOW_SHOCK.id:
					lastNoMercy.numBowShocks++
					break
			}
		}
	}

	private onRemoveNoMercy(event: BuffEvent) {
		const lastNoMercy = this.lastNoMercy

		if (lastNoMercy != null) {
			lastNoMercy.end = event.timestamp
		}
	}

	private onComplete() {
		// Exclude any window at the end of a fight which could not possibly have gotten all of its GCDs
		const missedGcds = this.noMercyWindows
			.filter(window => !window.isRushing)
			.reduce((sum, window) => sum + Math.max(0, EXPECTED_USES.GCD - window.numGcds), 0)

		// Sum up all the missing expected casts
		const missedBlastingZones = this.noMercyWindows
			.reduce((sum, window) => sum + Math.max(0, EXPECTED_USES.BLASTING_ZONE - window.numBlastingZones), 0)
		const missedSonicBreaks = this.noMercyWindows
			.reduce((sum, window) => sum + Math.max(0, EXPECTED_USES.SONIC_BREAK - window.numSonicBreaks), 0)
		const missedRoughDivides = this.noMercyWindows
			.reduce((sum, window) => sum + Math.max(0, EXPECTED_USES.ROUGH_DIVIDE - window.numRoughDivides), 0)
		const missedGnashingFangs = this.noMercyWindows
			.reduce((sum, window) => sum + Math.max(0, EXPECTED_USES.GNASHING_FANG - window.numGnashingFangs), 0)
		const missedBowShocks = this.noMercyWindows
			.reduce((sum, window) => sum + Math.max(0, EXPECTED_USES.BOW_SHOCK - window.numBowShocks), 0)
		const sumMissingExpectedUses = missedBlastingZones + missedSonicBreaks + missedRoughDivides + missedGnashingFangs + missedBowShocks

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.NO_MERCY.icon,
			content: <Trans id="gnb.nomercy.suggestions.gcds.content">
				Try to land 9 GCDs during every <ActionLink {...ACTIONS.NO_MERCY}/> window. A 20 second duration is sufficient
				to comfortably fit 9 GCDs with full uptime if you wait until the last one-third of your GCD timer to activate it.
			</Trans>,
			why: <Trans id="gnb.nomercy.suggestions.gcds.why">
				<Plural value={missedGcds} one="# GCD" other="# GCDs"/> missed during <StatusLink {...STATUSES.NO_MERCY}/> windows.
			</Trans>,
			tiers: SEVERITIES.TOO_FEW_GCDS,
			value: missedGcds,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.BLASTING_ZONE.icon,
			content: <Trans id="gnb.nomercy.suggestions.expected-uses.content">
				Watch your uses of certain abilities during <ActionLink {...ACTIONS.NO_MERCY}/>. Under ideal conditions, you should
				be using <ActionLink {...ACTIONS.SONIC_BREAK}/>, a full <ActionLink {...ACTIONS.GNASHING_FANG}/> combo, and all of
				your off-GCD skills - <ActionLink {...ACTIONS.BLASTING_ZONE}/>, <ActionLink {...ACTIONS.BOW_SHOCK}/>, and at least one
				charge of <ActionLink {...ACTIONS.ROUGH_DIVIDE}/> - under the buff duration.
			</Trans>,
			why: <Trans id="gnb.nomercy.suggestions.expected-uses.why">
				<Plural value={sumMissingExpectedUses} one="# expected cast" other="# expected casts"/> missed during <StatusLink {...STATUSES.NO_MERCY}/> windows.
			</Trans>,
			tiers: SEVERITIES.MISSING_EXPECTED_USES,
			value: sumMissingExpectedUses,
		}))
	}

	output() {
		return <RotationTable
			targets={[
				{
					header: <Trans id="gnb.nomercy.table.header.gcds">GCDs</Trans>,
					accessor: 'gcds',
				},
				{
					header: <ActionLink showName={false} {...ACTIONS.BLASTING_ZONE}/>,
					accessor: 'blastingZone',
				},
				{
					header: <ActionLink showName={false} {...ACTIONS.SONIC_BREAK}/>,
					accessor: 'sonicBreak',
				},
				{
					header: <ActionLink showName={false} {...ACTIONS.ROUGH_DIVIDE}/>,
					accessor: 'roughDivide',
				},
				{
					header: <ActionLink showName={false} {...ACTIONS.BOW_SHOCK}/>,
					accessor: 'bowShock',
				},
				{
					header: <ActionLink showName={false} {...ACTIONS.GNASHING_FANG}/>,
					accessor: 'gnashingFang',
				},
			]}
			data={this.noMercyWindows
				.map(window => {
					return ({
						start: window.start - this.parser.fight.start_time,
						end: window.end != null ?
							window.end - this.parser.fight.start_time
							: window.start - this.parser.fight.start_time,
						targetsData: {
							gcds: {
								actual: window.numGcds,
								expected: EXPECTED_USES.GCD,
							},
							blastingZone: {
								actual: window.numBlastingZones,
								expected: EXPECTED_USES.BLASTING_ZONE,
							},
							sonicBreak: {
								actual: window.numSonicBreaks,
								expected: EXPECTED_USES.BOW_SHOCK,
							},
							roughDivide: {
								actual: window.numRoughDivides,
								expected: EXPECTED_USES.ROUGH_DIVIDE,
							},
							bowShock: {
								actual: window.numBowShocks,
								expected: EXPECTED_USES.BOW_SHOCK,
							},
							gnashingFang: {
								actual: window.numGnashingFangs,
								expected: EXPECTED_USES.GNASHING_FANG,
							},
						},
						rotation: window.rotation,
					})
				})
			}
			onGoto={this.timeline.show}
		/>
	}
}
