import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook, TimestampHook} from 'parser/core/Dispatcher'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {History} from 'parser/core/modules/ActionWindow/History'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import React, {Fragment} from 'react'
import {Message} from 'semantic-ui-react'

// We always want 6 GCDs in WF
const EXPECTED_GCDS = 6

// XIV timestamps suck, WF might last longer than we expect
const WF_LENIENCE_MS = 200

const SEVERITIES = {
	BAD_WILDFIRE: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		3: SEVERITY.MAJOR,
	},
	FIZZLED_WILDFIRE: {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	},
}

interface WildfireWindow {
	events: Array<Events['action']>
	stacks: number
	damage?: number
}

export class Wildfire extends Analyser {
	static override handle = 'wildfire'
	static override title = t('mch.wildfire.title')`Wildfire`

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline

	private history = new History<WildfireWindow>(
		() => ({
			events: [],
			stacks: 0,
		})
	)

	private actionHook?: EventHook<Events['action']>
	private durationHook?: TimestampHook

	private actionFilter = filter<Event>()
		.source(this.parser.actor.id)
		.type('action')

	override initialise() {
		const playerFilter = filter<Event>()
			.source(this.parser.actor.id)

		this.addEventHook(
			playerFilter
				.type('statusApply')
				.status(this.data.statuses.WILDFIRE.id),
			this.onApply
		)

		this.addEventHook(
			playerFilter
				.type('damage')
				.cause(this.data.matchCauseStatusId([this.data.statuses.WILDFIRE.id])),
			this.onWildfireDamage
		)

		this.addEventHook('complete', this.onComplete)
	}

	private closeWindow(timestamp: number) {
		this.history.closeCurrent(timestamp)

		if (this.actionHook != null) {
			this.removeEventHook(this.actionHook)
			this.actionHook = undefined
		}

		if (this.durationHook != null) {
			this.removeTimestampHook(this.durationHook)
			this.durationHook = undefined
		}
	}

	private onApply(event: Events['statusApply']) {
		if (this.history.getCurrent() != null) {
			this.history.doIfOpen(current => current.stacks++)
			return
		}

		// First application of WF, start a new window
		this.history.openNew(event.timestamp)

		if (this.actionHook == null) {
			this.actionHook = this.addEventHook(this.actionFilter, this.onAction)
		}

		const expectedEnd = event.timestamp + this.data.statuses.WILDFIRE.duration + WF_LENIENCE_MS
		this.durationHook = this.addTimestampHook(expectedEnd, () => this.closeWindow(expectedEnd))
	}

	private onWildfireDamage(event: Events['damage']) {
		this.history.doIfOpen(current => current.damage = event.targets[0].amount)
		this.closeWindow(event.timestamp)
	}

	private onAction(event: Events['action']) {
		this.history.doIfOpen(current => current.events.push(event))
	}

	private onComplete() {
		this.history.closeCurrent(this.parser.currentEpochTimestamp)

		const badWildfires = this.history.entries
			.filter(wildfire => wildfire.data.stacks < EXPECTED_GCDS)
			.length

		const fizzledWildfires = this.history.entries
			.filter(wildfire => wildfire.data.damage == null || wildfire.data.damage === 0)
			.length

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.WILDFIRE.icon,
			content: <Trans id="mch.wildfire.suggestions.gcds.content">
				Try to ensure you have a Hypercharge prepared for every <ActionLink action="WILDFIRE"/> cast to maximize damage. Each GCD in a Wildfire window is worth 150 potency, so maximizing the GCD count with <ActionLink action="HEAT_BLAST"/> is important.
			</Trans>,
			tiers: SEVERITIES.BAD_WILDFIRE,
			value: badWildfires,
			why: <Trans id="mch.wildfire.suggestions.gcds.why">
				{badWildfires} of your Wildfire windows contained fewer than {EXPECTED_GCDS} GCDs.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.WILDFIRE.icon,
			content: <Trans id="mch.wildfire.suggestions.fizzle.content">
				Be careful to time your <ActionLink action="WILDFIRE"/> windows so that the damage resolves during uptime, or detonate them early if necessary to at least get partial potency.
			</Trans>,
			tiers: SEVERITIES.FIZZLED_WILDFIRE,
			value: fizzledWildfires,
			why: <Trans id="mch.wildfire.suggestions.fizzle.why">
				{fizzledWildfires} of your Wildfire windows ghosted or resolved for 0 damage.
			</Trans>,
		}))
	}

	override output() {
		if (this.history.entries.length === 0) { return undefined }

		const gcdHeader = {
			header: <Trans id="mch.wildfire.rotation-table.header.gcd-count">GCDs</Trans>,
			accessor: 'gcds',
		}

		const damageHeader = {
			header: <Trans id="mch.wildfire.rotation-table.header.damage">Damage</Trans>,
			accessor: 'damage',
		}

		const rotationData = this.history.entries.map(wildfire => ({
			start: wildfire.start - this.parser.pull.timestamp,
			end: (wildfire.end ?? wildfire.start) - this.parser.pull.timestamp,
			targetsData: {
				gcds: {
					actual: wildfire.data.stacks,
					expected: EXPECTED_GCDS,
				},
			},
			notesMap: {
				damage: wildfire.data.damage ?? 0,
			},
			rotation: wildfire.data.events.map(event => ({action: event.action})),
		}))

		return <Fragment>
			<Message>
				<Trans id="mch.wildfire.table.message">Every <ActionLink action="WILDFIRE"/> window should ideally include {EXPECTED_GCDS} GCDs to maximize the debuff's potency. Note that a GCD only counts toward Wildfire if the damage lands on the target before Wildfire expires; <b>GCDs that show up in the "Rotation" column did not necessarily resolve their damage under Wildfire!</b></Trans>
			</Message>
			<RotationTable
				targets={[gcdHeader]}
				notes={[damageHeader]}
				data={rotationData}
				onGoto={this.timeline.show}
			/>
		</Fragment>
	}
}
