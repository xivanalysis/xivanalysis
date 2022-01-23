import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import BrokenLog from 'parser/core/modules/BrokenLog'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

interface ImmortalSacrificeWindow {
	stackCount: number,
	/**
	 * If the stacks were consumed via Plentful harvest or dropped due to expiration or death
	 */
	consumed: boolean,
}

export class ImmortalSacrifice extends Analyser {

	static override handle = 'immortal-sacrifice'
	static override title = t('rpr.immortal-sacrifice.title')`Immortal Sacrifice`
	static override debug = false

	@dependency private brokenLog!: BrokenLog
	@dependency private data!: Data
	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

	private closedWindows: ImmortalSacrificeWindow[] = []
	private openWindow?: ImmortalSacrificeWindow

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.IMMORTAL_SACRIFICE.id), this.onStatusApply)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.IMMORTAL_SACRIFICE.id), this.onStatusRemove)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.PLENTIFUL_HARVEST.id), this.onPlentifulHarvest)

		this.addEventHook('complete', this.onComplete)
	}

	private onStatusApply(event: Events['statusApply']) {
		if (this.openWindow == null) {
			this.openWindow = {
				consumed: false,
				stackCount: 0,
			}
		}

		this.openWindow.stackCount = event.data ?? this.openWindow.stackCount + 1
	}

	private onPlentifulHarvest() {
		if (this.openWindow == null) {
			this.brokenLog.trigger(this, 'PH without immortal sacrifice stack',
				<Trans id="rpr.immortal-sacrifice.checklist.trigger.no-immortal-sacrifice">
					<DataLink action="PLENTIFUL_HARVEST"/> was executed but there were
					no <DataLink status="IMMORTAL_SACRIFICE"/> stacks.
				</Trans>)
			return
		}

		this.debug('Closing window because plentiful harvest was used', this.openWindow)
		this.onWindowClose(true)
	}

	private onStatusRemove() {
		// valid case, means it was consumed
		if (this.openWindow == null) {
			return
		}

		this.debug('Closing window that was expired before consumption', this.openWindow)
		this.onWindowClose(false)
	}

	private onWindowClose(consumed: boolean) {
		if (this.openWindow == null) {
			return
		}

		this.openWindow.consumed = consumed

		this.closedWindows.push(this.openWindow)
		this.openWindow = undefined
	}

	private onComplete() {
		const totalWindows = this.closedWindows.length

		if (totalWindows > 0) {
			let plentifulHarvestUses = 0
			let totalStacks = 0
			let stacksConsumed = 0

			for (const closedWindow of this.closedWindows) {
				totalStacks += closedWindow.stackCount

				if (closedWindow.consumed) {
					stacksConsumed += closedWindow.stackCount
					plentifulHarvestUses += 1
				}
			}

			const phUsesPercent = (plentifulHarvestUses / totalWindows * 100).toFixed(2)
			const stacksConsumedPercent = (stacksConsumed / totalStacks * 100).toFixed(2)

			this.checklist.add(new Rule({
				name: <Trans id="rpr.immortal-sacrifice.checklist.title">
					Use Immortal Sacrifices via <DataLink action="PLENTIFUL_HARVEST"/>
				</Trans>,
				description: <Trans id="rpr.immortal-sacrifice.checklist.description">
					<DataLink status="IMMORTAL_SACRIFICE"/> stacks will be generated when you
					use <DataLink action="ARCANE_CIRCLE"/>, you can then consume those stacks by
					using <DataLink action="PLENTIFUL_HARVEST"/>. On top of being a high potency skill, it also grants
					enough Shroud gauge to immediately use <DataLink action="ENSHROUD"/>.
				</Trans>,
				displayOrder: DISPLAY_ORDER.IMMORTAL_SACRIFICE,
				requirements: [
					new Requirement({
						name: <Trans id="rpr.immortal-sacrifice.checklist.plentiful-harvest.requirement.name">
							<DataLink action="PLENTIFUL_HARVEST"/> uses
						</Trans>,
						overrideDisplay: `${plentifulHarvestUses} / ${totalWindows} (${phUsesPercent}%)`,
						percent: phUsesPercent,
					}),
					new Requirement({
						name: <Trans id="rpr.immortal-sacrifice.checklist.requirement.name">
							<DataLink status="IMMORTAL_SACRIFICE"/> stacks used
						</Trans>,
						overrideDisplay: `${stacksConsumed} / ${totalStacks} (${stacksConsumedPercent}%)`,
						percent: stacksConsumedPercent,
					}),
				],
			}))
		} else {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.ARCANE_CIRCLE.icon,
				severity: SEVERITY.MAJOR,
				content: <Trans id="rpr.immortal-sacrifice.suggestion.no-usage.content">
					Make sure you use <DataLink action="ARCANE_CIRCLE"/> in the fight and it hit your party members
					to help generating <DataLink status="IMMORTAL_SACRIFICE"/>, and make sure to use those stacks
					via <DataLink action="PLENTIFUL_HARVEST"/> before they expire.
				</Trans>,
				why: <Trans id="rpr.immortal-sacrifice.suggestion.no-usage.why">
					No stacks of <DataLink status="IMMORTAL_SACRIFICE"/> were generated during the fight.
				</Trans>,
			}))
		}
	}
}
