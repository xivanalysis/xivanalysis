import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import Checklist, {Requirement, TARGET, TieredRule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

const DELIRIUM_CONSUMERS: ActionKey[] = [
	'BLOODSPILLER',
	'QUIETUS',
]
const SEVERITY = {
	95: TARGET.WARN,
	100: TARGET.SUCCESS,
}

export class Delirium extends Analyser {
	static override handle = 'delirium'
	static override title = t('drk.delirium.title')`Delirium Usage`
	static override displayOrder = DISPLAY_ORDER.DELIRIUM

	@dependency private actors!: Actors
	@dependency private checklist!: Checklist
	@dependency private data!: Data

	private stacksPerUse = this.data.statuses.DELIRIUM.stacksApplied ?? 0
	private stacksGained = 0
	private stacksUsed = 0

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.DELIRIUM.id), () => this.stacksGained += this.stacksPerUse)
		this.addEventHook(playerFilter.type('action').action(oneOf(DELIRIUM_CONSUMERS.map(key => this.data.actions[key].id))), this.onDeliriumConsumer)
		this.addEventHook('complete', this.onComplete)
	}

	private onDeliriumConsumer() {
		if (this.actors.current.hasStatus(this.data.statuses.DELIRIUM.id)) {
			this.stacksUsed++
		}
	}

	private onComplete() {
		const percentUsed = this.stacksGained > 0 ? (this.stacksUsed / this.stacksGained * 100).toFixed(2) : 0
		this.checklist.add(new TieredRule({
			name: <Trans id="drk.delirium.checklist.name">Use All Delirium Stacks</Trans>,
			description: <Trans id="drk.delirium.checklist.description">
				<DataLink action="DELIRIUM" /> grants {this.stacksPerUse} stacks to use on <DataLink action="BLOODSPILLER" /> (or <DataLink action="QUIETUS" /> on 3 or more targets).
				Be sure to use all stacks generated.
			</Trans>,
			tiers: SEVERITY,
			requirements: [
				new Requirement({
					name: <Trans id="drk.delrium.checklist.requirement.name">
						<DataLink action="DELIRIUM" /> stacks used
					</Trans>,
					overrideDisplay: `${this.stacksUsed} / ${this.stacksGained} (${percentUsed}%)`,
					percent: percentUsed,
				}),
			],
		}))
	}
}
