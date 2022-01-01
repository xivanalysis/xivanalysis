import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import {DataLink} from '../../../../components/ui/DbLink'
import {Event, Events} from '../../../../event'
import {Analyser} from '../../../core/Analyser'
import {filter} from '../../../core/filter'
import {dependency} from '../../../core/Injectable'
import BrokenLog from '../../../core/modules/BrokenLog'
import Checklist, {Requirement, Rule} from '../../../core/modules/Checklist'
import {Data} from '../../../core/modules/Data'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

interface ImmortalSacrificeWindow {
	startTime: number,
	endTime?: number,
	/**
	 * If this window was closed, by consuming the stacks, or it expired
	 */
	closed: boolean,
	stackCount: number,
	consumed: boolean,
}

export default class ImmortalSacrifice extends Analyser {

	static override handle = 'immortalsacrifice'
	static override title = t('rpr.immortal-sacrifice.title')`Immortal Sacrifice stacks consumed`
	static override debug = false

	@dependency private brokenLog!: BrokenLog
	@dependency private data!: Data
	@dependency private checklist!: Checklist

	private windows: ImmortalSacrificeWindow[] = []

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.IMMORTAL_SACRIFICE.id), this.onImmortalSacrificeStack)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.IMMORTAL_SACRIFICE.id), this.onImmortalSacrificeExpiration)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.PLENTIFUL_HARVEST.id), this.onPlentifulHarvest)

		this.addEventHook('complete', this.onComplete)
	}

	private onImmortalSacrificeStack(event: Events['statusApply']) {
		let window = this.getOpenWindow()

		if (window == null) {
			window = {
				startTime: event.timestamp,
				closed: false,
				consumed: false,
				stackCount: 0,
			}

			this.windows.push(window)
		}

		window.stackCount = event.data ?? window.stackCount + 1
	}

	private onPlentifulHarvest(event: Events['action']) {
		const window = this.getOpenWindow()

		if (window == null) {
			this.brokenLog.trigger(this, 'PH without immortal sacrifice stack',
				<Trans id="rpr.immortal-sacrifice.trigger.no-immortal-sacrifice">
					<DataLink action="PLENTIFUL_HARVEST"/> was executed but there were
					no <DataLink status="IMMORTAL_SACRIFICE"/> stacks.
				</Trans>)
			return
		}

		this.debug('Closing window because plentiful harvest were used', window)

		window.closed = true
		window.endTime = event.timestamp
		window.consumed = true
	}

	private onImmortalSacrificeExpiration(event: Events['statusRemove']) {
		const window = this.getOpenWindow()

		// valid case, means it was consumed
		if (window == null) {
			return
		}

		this.debug('Closing window that was expired before consumption', window)

		window.closed = true
		window.consumed = false
		window.endTime = event.timestamp
	}

	private getOpenWindow() {
		if (this.windows.length > 0) {
			const w = this.windows[this.windows.length - 1]

			if (!w.closed) {
				return w
			}

		}

		return null
	}

	private onComplete() {
		this.debug(() => {
			this.debug('Immortal sacrifice windows')

			this.windows.forEach(w => {
				const start = this.parser.formatEpochTimestamp(w.startTime)
				const end = w.endTime != null ? this.parser.formatEpochTimestamp(w.endTime) : '<Not Closed>'

				this.debug(`Start: ${start}, End: ${end}, Closed: ${w.closed}, Consumed: ${w.consumed}, Stack Count: ${w.stackCount}`)
			})
		})

		const totalImmortalSacrifices = this.windows.length

		if (totalImmortalSacrifices <= 0) {
			return
		}

		const consumedImmortalSacrifices = this.windows.filter(w => w.consumed).length
		const percentUsed = (consumedImmortalSacrifices / totalImmortalSacrifices * 100).toFixed(2)

		this.checklist.add(new Rule({
			name: <Trans id="rpr.immortal-sacrifice.checklist.title">Uses all Immortal Sacrifices stack</Trans>,
			description: <Trans id="rpr.immortal-sacrifice.checklist.description">
				<DataLink status="IMMORTAL_SACRIFICE"/> stacks will be generated when you
				use <DataLink action="ARCANE_CIRCLE"/>, you can then consume those stacks by
				using <DataLink action="PLENTIFUL_HARVEST"/>, not only it's a high potency skill, it also grants enough
				Shroud gauge for a <DataLink action="ENSHROUD"/> usage.
			</Trans>,
			displayOrder: DISPLAY_ORDER.IMMORTAL_SACRIFICE,
			requirements: [
				new Requirement({
					name: <Trans id="rpr.immortal-sacrifice.checklist.requirement.name">
						<DataLink status="IMMORTAL_SACRIFICE"/> stacks consumed
					</Trans>,
					overrideDisplay: `${consumedImmortalSacrifices} / ${totalImmortalSacrifices} (${percentUsed}%)`,
					percent: percentUsed,
				}),
			],
		}))
	}
}
