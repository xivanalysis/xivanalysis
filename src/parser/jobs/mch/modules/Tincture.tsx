import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {EvaluatedAction, ExpectedActionsEvaluator, TrackedAction, TrackedActionsOptions} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {Tincture as CoreTincture} from 'parser/core/modules/Tincture'
import React from 'react'

const TINCTURE_OPENER_BUFFER = 10000
const BS_REQUIREMENT = 10
const BS_REQUIREMENT_OPENER = 5

interface reassembleOptions extends TrackedActionsOptions {
	reassembleId: number
	countReassemblesUsed: (window: HistoryEntry<EvaluatedAction[]>) => number
}

class ReassembleEvaluator extends ExpectedActionsEvaluator {
	// Because this class is not an Analyser, it cannot use Data directly
	// to get the id for Reassemble, so it has to take it in here.
	private reassembleId: number
	private countReassemblesUsed: (window: HistoryEntry<EvaluatedAction[]>) => number

	constructor(opts: reassembleOptions) {
		super(opts)
		this.reassembleId = opts.reassembleId
		this.countReassemblesUsed = opts.countReassemblesUsed
	}

	override countUsed(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {
		if (action.action.id === this.reassembleId) {
			return this.countReassemblesUsed(window)
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
					action: this.data.actions.FULL_METAL_FIELD,
					expectedPerWindow: 1,
				},
			],
			suggestionIcon: this.data.actions.INFUSION_DEX.icon,
			suggestionContent: <Trans id="mch.tincture.suggestions.trackedActions.content">
				Try to cover as much damage as possible with your Tinctures of Dexterity.
			</Trans>,
			suggestionWindowName: <DataLink item="INFUSION_DEX" showIcon={false} />,
			severityTiers: {
				2: SEVERITY.MINOR,
				4: SEVERITY.MEDIUM,
				6: SEVERITY.MAJOR,
			},
			reassembleId: this.data.actions.REASSEMBLE.id,
			countReassemblesUsed: this.countReassemblesUsed.bind(this),
		}))

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.BLAZING_SHOT,
					expectedPerWindow: BS_REQUIREMENT,
				},
			],
			suggestionIcon: this.data.actions.BLAZING_SHOT.icon,
			suggestionContent: <Trans id="mch.tincture.suggestions.blazingShot.content">
				Try to fit at least two uses of <DataLink action="HYPERCHARGE" /> in every Tincture window after the opener.
			</Trans>,
			suggestionWindowName: <DataLink item="INFUSION_DEX" showIcon={false} />,
			severityTiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
			},
			adjustCount: this.adjustExpectedBlazingShotCount.bind(this),
		}))
	}

	private onRemoveReassembled(event: Events['statusRemove']) {
		this.reassembledRemoves.push(event.timestamp)
	}

	private countReassemblesUsed(window: HistoryEntry<EvaluatedAction[]>) {
		const gcdTimestamps = window.data
			.filter(e => e.action.onGcd)
			.map(e => e.timestamp)
		if (gcdTimestamps.length === 0) { return 0 }

		const firstGcd = gcdTimestamps[0]
		return this.reassembledRemoves.filter(timestamp => firstGcd <= timestamp && timestamp <= (window.end ?? window.start)).length
	}

	private adjustExpectedBlazingShotCount(window: HistoryEntry<EvaluatedAction[]>) {
		// Only require 5 Blazing Shots if the potion was used at the start of the fight
		if (window.start - TINCTURE_OPENER_BUFFER <= this.parser.pull.timestamp) {
			return BS_REQUIREMENT_OPENER - BS_REQUIREMENT
		}

		return 0
	}
}
