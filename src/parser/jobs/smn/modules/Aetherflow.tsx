import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {History} from 'parser/core/modules/ActionWindow/History'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

const MAX_ALLOWED_FILLER_COUNT = 2

interface AetherflowState {
	aetherflowRemaining: number
	fillerCount: number
	usedRuin4: boolean
}

const AETHERFLOW_GENERATORS: ActionKey[] = [
	'SMN_ENERGY_DRAIN',
	'ENERGY_SIPHON',
]
const AETHERFLOW_SPENDERS: ActionKey[] = [
	'FESTER',
	'PAINFLARE',
	'NECROTIZE',
]

// These are lower potency filler casts.  If one of these was
// cast, the Ruin IV should have been used in that minute.
const FILLER_CASTS: ActionKey[] = [
	'RUIN_III',
	'TRI_DISASTER',
]

export class Aetherflow extends Analyser {
	static override handle = 'aetherflow'
	static override title = t('smn.aetherflow.title')`Aetherflow`

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private history = new History<AetherflowState>(
		() => { return {aetherflowRemaining: 2, fillerCount: 0, usedRuin4: false} }
	)

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(
			playerFilter
				.action(this.data.matchActionId(AETHERFLOW_GENERATORS))
				.type('action'),
			this.onGenerator)
		this.addEventHook(
			playerFilter
				.action(this.data.matchActionId(AETHERFLOW_SPENDERS))
				.type('action'),
			this.onSpender)

		this.addEventHook(
			playerFilter
				.action(this.data.matchActionId(FILLER_CASTS))
				.type('action'),
			this.onFiller
		)
		this.addEventHook(
			playerFilter.action(this.data.actions.RUIN_IV.id).type('action'),
			this.onRuin4
		)

		this.addEventHook('complete', this.onComplete)
	}

	private onGenerator(event: Events['action']) {
		this.history.openNew(event.timestamp)

	}

	private onSpender() {
		this.history.doIfOpen(current => {
			if (current.aetherflowRemaining > 0) {
				current.aetherflowRemaining -= 1
			}
		})
	}

	private onFiller() {
		this.history.doIfOpen(current => current.fillerCount += 1)
	}

	private onRuin4() {
		this.history.doIfOpen(current => current.usedRuin4 = true)
	}

	private onComplete() {
		this.history.closeCurrent(this.parser.pull.timestamp + this.parser.pull.duration)

		// Ensure all Aetherflow stacks were used.
		// Fester vs Painflare is checked by MultiHitSkills
		const lostAetherflow = this.history.entries.reduce((acc, entry) => acc + entry.data.aetherflowRemaining, 0)
		if (lostAetherflow > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.SMN_ENERGY_DRAIN.icon,
				content: <Trans id="smn.aetherflow.lost-aetherflow.content">
					Ensure you gain a full 2 stacks of Aetherflow per cast. Every lost stack is a significant potency loss.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="smn.aetherflow.lost-aetherflow.why">
					<Plural value={lostAetherflow} one="# stack" other="# stacks"/>
					of Aetherflow lost.
				</Trans>,
			}))
		}

		// Ensure that Ruin 4 stacks were used.  When downtime is involved,
		// not using the Ruin 4 may be acceptable since there are other
		// equal or higher potency skills on the summons.
		// However, Ruin 3 or Tri-disaster should not be cast if it prevents
		// casting Ruin 4.
		const wastedR4 = this.history.entries.filter(entry => entry.data.fillerCount > 0 && !entry.data.usedRuin4).length
		if (wastedR4) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.RUIN_IV.icon,
				content: <Trans id="smn.aetherflow.lost-ruin4.content">
					Prefer using Ruin 4 instead of Ruin 3 or Tri-disaster.
					You may need to hold the Ruin 4 for movement, but it should be used before the next
					<ActionLink action="SMN_ENERGY_DRAIN"/> or <ActionLink action="ENERGY_SIPHON"/> cast.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="smn.aetherflow.lost-ruin4.why">
					<Plural value={wastedR4} one="# cast" other="# casts"/> of Ruin 4 lost.
				</Trans>,
			}))
		}

		// Based on the time taken to work through all of the summons per minute,
		// you should have 2 or fewer casts of Ruin 3 or Tri-disaster per minute.
		const extraR3 = this.history.entries
			.filter(entry => entry.data.fillerCount > MAX_ALLOWED_FILLER_COUNT)
			.reduce((acc, entry) => acc + entry.data.fillerCount - MAX_ALLOWED_FILLER_COUNT, 0)
		if (extraR3 > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.RUIN_III.icon,
				content: <Trans id="smn.aetherflow.extra-ruin3.content">
					Use Ruin 4, summon skills, and their related skills to keep the number of Ruin 3 or Tri-disaster casts per minute below {MAX_ALLOWED_FILLER_COUNT + 1}.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="smn.aetherflow.extra-ruin3.why">
					<Plural value={extraR3} one="# extra cast" other="# extra casts"/> of Ruin 3 or Tri-disaster were performed.
				</Trans>,
			}))
		}
	}
}
