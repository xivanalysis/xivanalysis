import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import BrokenLog from 'parser/core/modules/BrokenLog'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import Downtime from 'parser/core/modules/Downtime'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

interface SoulSowData {
	/**
	 * When we got the status applied
	 */
	timestamp: number
	/**
	 * If it was used by casting Harvest Moon
	 */
	used: boolean
}

export class HarvestMoon extends Analyser {

	@dependency private downtime!: Downtime
	@dependency private data!: Data
	@dependency private checklist!: Checklist
	@dependency private brokenLog!: BrokenLog

	static override title = 'Harvest Moon'
	static override handle = 'harvest_moon'

	private readonly SOUL_SOW_CAST_TIME = 5000
	private soulSowData: SoulSowData[] = []
	private currentSoulSow?: SoulSowData

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.SOULSOW.id), this.onHarvestMoonStatusApply)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.SOULSOW.id), this.onHarvestMoonStatusRemove)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.HARVEST_MOON.id), this.onHarvestMoonUsage)

		this.addEventHook('complete', this.onComplete)
	}

	private onHarvestMoonStatusApply(event: Events['statusApply']) {
		if (this.currentSoulSow == null) {
			this.currentSoulSow = {
				used: false,
				timestamp: event.timestamp,
			}
		}
	}

	private onHarvestMoonStatusRemove() {
		this.onHarvestMoonUsed(false)
	}

	private onHarvestMoonUsage() {
		this.onHarvestMoonUsed(true)
	}

	private onHarvestMoonUsed(used: boolean) {
		if (this.currentSoulSow == null) {
			if (used) {
				this.brokenLog.trigger(this, 'rpr.harvest-moon.trigger.use-before-soulsow', 'Harvest moon were used prior to using Soul Sow skill')
			}

			return
		}

		this.currentSoulSow.used = used
		this.soulSowData.push(this.currentSoulSow)
		this.currentSoulSow = undefined
	}

	private onComplete() {
		const downtimeWindows = this.downtime.getDowntimeWindows()

		const requirements: Requirement[] = []

		const prePullUsage = this.soulSowData.find(d => d.timestamp <= this.parser.pull.timestamp)

		requirements.push(this.createSoulSowChecklistRequirement(
			<Trans id="rpr.harvest-moon.checklist.requirement.pre-pull.name">Usage on pre-pull</Trans>,
			prePullUsage)
		)

		if (downtimeWindows.length > 0) {
			downtimeWindows.forEach(dw => {
				const duration = dw.end - dw.start
				const isValidWindow = duration > this.SOUL_SOW_CAST_TIME

				// if the window was enough to cast soul sow check if we actually did
				if (isValidWindow) {
					const soulSowUsage = this.getSoulSowCastOnWindow(dw.start, dw.end)

					const startTime = this.parser.formatEpochTimestamp(dw.start)
					const endTime = this.parser.formatEpochTimestamp(dw.end)

					requirements.push(this.createSoulSowChecklistRequirement(
						<Trans id="rpr.harvest-moon.checklist.requirement.downtime.name">Usage on downtime
							window {startTime} to {endTime}</Trans>,
						soulSowUsage
					))
				}
			})

			this.checklist.add(new Rule({
				name: <Trans id="rpr.harvest-moon.checklist.name">Use <ActionLink action="SOULSOW"/> during pre-pull and
					downtime</Trans>,
				description: <Trans id="rpr.harvest-moon.checklist.description">The <ActionLink action="SOULSOW"/> skill
					have a very high potency but also high cast time during battle, consider casting it before the fight
					starts and also when the fight is in a downtime.
					Don't forget to use <ActionLink action="HARVEST_MOON"/> before a downtime.</Trans>,
				requirements,
				displayOrder: DISPLAY_ORDER,
			}))
		}
	}

	private getSoulSowCastOnWindow(startTime: number, endTime: number): SoulSowData | undefined {
		for (const soulSowData of this.soulSowData) {
			if (soulSowData.timestamp >= startTime && soulSowData.timestamp <= endTime) {
				return soulSowData
			}
		}

		return undefined
	}

	private createSoulSowChecklistRequirement(name: JSX.Element, soulSowUsage?: SoulSowData): Requirement {
		const soulSowUsed = soulSowUsage != null ? 1 : 0
		const harvestMoonUsed = soulSowUsage != null && soulSowUsage.used ? 1 : 0

		return new Requirement({
			name,
			value: (soulSowUsed + harvestMoonUsed) / 2 * 100,
			overrideDisplay: <> <ActionLink action="SOULSOW"/> {soulSowUsed} / 1,
				<ActionLink action="HARVEST_MOON"/> {harvestMoonUsed} / 1
			</>,
		})
	}
}
