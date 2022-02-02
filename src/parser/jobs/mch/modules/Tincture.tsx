import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {EvaluatedAction, ExpectedActionsEvaluator, TrackedAction, TrackedActionsOptions} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {Tincture as CoreTincture} from 'parser/core/modules/Tincture'
import React from 'react'

interface reassembleOptions extends TrackedActionsOptions {
	reassembleId: number
	wasReassembleUsed: (window: HistoryEntry<EvaluatedAction[]>) => boolean
}

class ReassembleEvaluator extends ExpectedActionsEvaluator {
	// Because this class is not an Analyser, it cannot use Data directly
	// to get the id for Reassemble, so it has to take it in here.
	private reassembleId: number
	private wasReassembleUsed: (window: HistoryEntry<EvaluatedAction[]>) => boolean

	constructor(opts: reassembleOptions) {
		super(opts)
		this.reassembleId = opts.reassembleId
		this.wasReassembleUsed = opts.wasReassembleUsed
	}

	override countUsed(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {
		if (action.action.id === this.reassembleId) {
			return this.wasReassembleUsed(window) ? 1 : 0
		}
		return super.countUsed(window, action)
	}
}

export class Tincture extends CoreTincture {
	private reassembledRemoves: number[] = []

	override initialise() {
		super.initialise()

		this.addEventHook(filter<Event>().source(this.parser.actor.id).status(this.data.statuses.REASSEMBLED.id)
			.type('statusRemove'), this.onRemoveReassembled)
		const pets = this.parser.pull.actors
			.filter(actor => actor.owner === this.parser.actor)
			.map(actor => actor.id)
		this.addEventHook(
			filter<Event>()
				.source(oneOf(pets))
				.action(oneOf([this.data.actions.PILE_BUNKER.id, this.data.actions.CROWNED_COLLIDER.id]))
				.type('action'),
			this.onWindowAction
		)

		this.addEvaluator(new ReassembleEvaluator({
			expectedActions: [
				{
					action: this.data.actions.WILDFIRE,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.REASSEMBLE,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.CROWNED_COLLIDER,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.DRILL,
					expectedPerWindow: 2,
				},
				{
					action: this.data.actions.CHAIN_SAW,
					expectedPerWindow: 1,
				},
			],
			suggestionIcon: this.data.actions.INFUSION_DEX.icon,
			suggestionContent: <Trans id="mch.tincture.suggestions.trackedActions.content">
				Try to cover as much damage as possible with your Tinctures of Dexterity.
			</Trans>,
			suggestionWindowName: <DataLink action="INFUSION_DEX" showIcon={false} />,
			severityTiers: {
				2: SEVERITY.MINOR,
				4: SEVERITY.MEDIUM,
				6: SEVERITY.MAJOR,
			},
			reassembleId: this.data.actions.REASSEMBLE.id,
			wasReassembleUsed: this.wasReassembleUsed.bind(this),
		}))
	}

	private onRemoveReassembled(event: Events['statusRemove']) {
		this.reassembledRemoves.push(event.timestamp)
	}

	private wasReassembleUsed(window: HistoryEntry<EvaluatedAction[]>) {
		const gcdTimestamps = window.data
			.filter(e => e.action.onGcd)
			.map(e => e.timestamp)
		if (gcdTimestamps.length === 0) { return false }

		// Check to make sure at least one GCD happened before the status expired
		const firstGcd = gcdTimestamps[0]
		return this.reassembledRemoves.some(timestamp => firstGcd <= timestamp && timestamp <= (window.end ?? window.start))
	}

}
