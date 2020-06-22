import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import {Requirement, Rule} from 'parser/core/modules/Checklist'
import React from 'react'
import Checklist from './Checklist'
import {Data} from './Data'
import Downtime from './Downtime'

interface CooldownReset {
	/**
	 * One or more skills that trigger a cooldown reset.
	 */
	actions: Action[],
	/**
	 * The amount of time in ms that an action deducts from the remaining
	 * cooldown of the affected cooldowns.
	 */
	refundAmount: number
}

interface CooldownGroup {
	/**
	 * One or more skills that share a recharge.
	 */
	cooldowns: Action[],
	/**
	 * Allowed time in ms a cooldown can be held after its cooldown has ended
	 * that will not be counted as lost time.  If no value is provided, a basic
	 * 2500 ms will be used to account for skills coming available too late in
	 * the GCD to be used immediately.
	 *
	 * This value will be ignored and treated as 0 for cooldowns that have
	 * multiple charges. Their 'allowed downtime' is the build up time of the
	 * extra charges.
	 */
	allowedAverageDowntime?: number,
	/**
	 * Time in ms that the skill is expected to be used for the first time in
	 * a fight.  This should be based on the opener for the class, and will also
	 * be considered after long downtimes.
	 */
	firstUseOffset?: number,
	/**
	 * Determines if the cooldown provided in the action data is reduced by
	 * skill/spell speed or other modifiers that affect GCD length.
	 * Currently, this property is not used due to the low reliability of GCD estimates.
	 */
	// isAffectedBySpeed: boolean
	/**
	 * Any skills that deduct from charge time for this group.
	 */
	resetBy?: CooldownReset
}

export abstract class CooldownDowntime extends Module {
	static handle = 'cooldownDowntime'
	static title = t('core.cooldownDowntime.title')`Cooldown Downtime`
	static debug = false

	@dependency private data!: Data
	@dependency private downtime!: Downtime
	@dependency private checklist!: Checklist

	/**
	 * Implementing modules MUST provide a list of tracked cooldowns
	 */
	protected abstract trackedCds: CooldownGroup[]

	private usages = new Map<CooldownGroup, CastEvent[]>()
	private resets = new Map<CooldownGroup, CastEvent[]>()

	protected checklistName = <Trans id="core.cooldownDowntime.use-ogcd-cds">Use your cooldowns</Trans>
	protected checklistDescription = <Trans id="core.cooldownDowntime.ogcd-cd-metric">Always make sure to use your actions
		when they are available, but do not clip your GCD to use them.</Trans>
	protected checklistTarget = 95

	protected defaultAllowedAverageDowntime = 1250
	protected defaultFirstUseOffset = 0

	/**
	 * Implementing modules MAY filter out some usages as 'fake' usages
	 * of a cooldown.
	 *
	 * The primary example of this would be NIN mudras, where any mudra
	 * may start a usage, but further mudras while the Mudra buff or any
	 * during the Kassatsu buff should not be counted as usages, even
	 * though all 3 mudra skills are part of the group.
	 *
	 * @param event The cast that may or may not be counted.
	 * @returns True if the event should be counted or false if the event
	 * should not be counted as a usage of the cooldown.
	 */
	protected countUsage(event: CastEvent): boolean {
		return true
	}

	protected init() {
		const trackedIds = this.trackedCds.map(group => group.cooldowns)
			.reduce((acc, cur) => acc.concat(cur))
			.map(action => action.id)

		const resetIds = this.trackedCds
			.map(group => group.resetBy?.actions ?? [])
			.reduce((acc, cur) => acc.concat(cur))
			.map(action => action.id)

		this.addEventHook('cast', {by: 'player', abilityId: trackedIds}, this.onTrackedCast)
		this.addEventHook('cast', {by: 'player', abilityId: resetIds}, this.onResetCast)
		this.addEventHook('complete', this.onComplete)

		this.trackedCds.forEach(group => {
			this.usages.set(group, [])
			this.resets.set(group, [])
		})
	}

	private onTrackedCast(event: CastEvent) {
		if (!this.countUsage(event)) {
			return
		}

		const group = this.getTrackedGroup(event.ability.guid)
		if (group === undefined) {
			return
		}

		(this.usages.get(group) || []).push(event)
	}

	private getTrackedGroup(abilityId: number): CooldownGroup | undefined {
		return this.trackedCds.find(group => group.cooldowns.find(action => action.id === abilityId) !== undefined)
	}

	private onResetCast(event: CastEvent) {
		this.trackedCds.forEach(group => {
			if (group.resetBy?.actions.find(action => action.id === event.ability.guid)) {
				(this.resets.get(group) || []).push(event)
			}
		})
	}

	private onComplete() {
		const cdRequirements = []
		for (const cdGroup of this.trackedCds) {
			const expected = this.calculateMaxUsages(cdGroup)
			const actual = (this.usages.get(cdGroup) || []).length || 0
			let percent = actual / expected * 100
			if (process.env.NODE_ENV === 'production') {
				percent = Math.min(percent, 100)
			}
			const requirementDisplay = cdGroup.cooldowns.map((val, ix) => <>
				{(ix > 0 ? ', ' : '')}
				<ActionLink {...this.data.getAction(val.id)} />
			</>)
			this.debug(JSON.stringify(requirementDisplay))

			cdRequirements.push(new Requirement({
				name: requirementDisplay,
				percent,
				overrideDisplay: `${actual} / ${expected} (${percent.toFixed(2)}%)`,
			}))
		}

		this.checklist.add(new Rule({
			name: this.checklistName,
			description: this.checklistDescription,
			requirements: cdRequirements,
			target: this.checklistTarget,
		}))
	}

	protected calculateMaxUsages(group: CooldownGroup): number {
		const gRep = group.cooldowns[0]
		if (gRep.cooldown === undefined) {
			return 0
		}
		const maxCharges = gRep.charges || 1

		// Skill with charges get their allowed downtime from the charge build up time,
		// so ignore the value on the group object
		const step = gRep.cooldown * 1000 + ((maxCharges > 1) ? 0 : (group.allowedAverageDowntime || this.defaultAllowedAverageDowntime))

		const gResets = this.resets.get(group) || []
		const gUsages = (this.usages.get(group) || [])
		const dtUsages = gUsages
			.filter(u => this.downtime.isDowntime(u.timestamp))
			.map(u => this.downtime.getDowntimeWindows(u.timestamp)[0])
		const resetTime = (group.resetBy && group.resetBy.refundAmount) ? group.resetBy.refundAmount : 0

		let timeLost = 0 // TODO: this variable is for logging only and does not actually affect the final count

		this.debug(`Checking downtime for group ${gRep.name} with default first use ${group.firstUseOffset} and step ${step} and ${maxCharges} charges`)
		let charges = maxCharges
		let count = 0
		const expectedFirstUseTime = this.parser.eventTimeOffset + (group.firstUseOffset || this.defaultFirstUseOffset)
		const actualFirstUseTime = gUsages[0]

		let currentTime = expectedFirstUseTime
		if ((group.firstUseOffset || 0) < 0 && maxCharges === 1) {
			// check for pre-fight usages, which cause synthesized usage events
			// that will have timestamps that don't accurartely indicated when
			// exactly they were used pre-fight
			const actualSecondUseTime = gUsages[1]
			if (actualSecondUseTime && (actualSecondUseTime.timestamp - actualFirstUseTime.timestamp) < gRep.cooldown * 1000) {
				this.debug(`Assumed first use of skill ${gRep.name} at ${this.parser.formatTimestamp(actualSecondUseTime.timestamp - gRep.cooldown * 1000)}`)
				this.debug(`Actual second use of skill ${gRep.name} at ${this.parser.formatTimestamp(actualSecondUseTime.timestamp)}`)
				count += 1 // add in the pre-fight usage
				currentTime = actualSecondUseTime.timestamp
			} else if (actualFirstUseTime) {
				// If the actual second usage isn't early enough to suggest an actual pre-fight usage, follow normal logic.
				// Start at the earlier of the actual first use or the expected first use
				this.debug(`Actual first use of skill ${gRep.name} at ${this.parser.formatTimestamp(actualFirstUseTime.timestamp)}`)
				currentTime = Math.min(actualFirstUseTime.timestamp, expectedFirstUseTime)
			}
		} else if (actualFirstUseTime) {
			// Start at the earlier of the actual first use or the expected first use
			this.debug(`Actual first use of skill ${gRep.name} at ${this.parser.formatTimestamp(actualFirstUseTime.timestamp)}`)
			currentTime = Math.min(actualFirstUseTime.timestamp, expectedFirstUseTime)
		}

		while (currentTime - this.parser.eventTimeOffset < this.parser.pull.duration) {
			// spend accumulated charges
			count += charges
			this.debug(`Expected ${charges} usages at ${this.parser.formatTimestamp(currentTime)}. Count: ${count}`)
			charges = 0

			// build a new charge at the next charge time
			currentTime += step
			charges += 1

			// apply resets that are found
			while (gResets.length > 0 && gResets[0].timestamp < currentTime) {
				const rs = gResets[0]
				const previousTime = currentTime
				if (currentTime - resetTime < rs.timestamp) {
					if (charges < maxCharges) {
						// if not at max charges, the "extra" reset time counts toward
						// the next charge wihtout being lost
						currentTime -= resetTime
					} else {
						timeLost += rs.timestamp - (currentTime - resetTime)
						currentTime = rs.timestamp
					}
				} else {
					currentTime -= resetTime
				}
				this.debug(`Reset (${rs.ability.name}) used at ${this.parser.formatTimestamp(rs.timestamp)}. Changing next charge time from ${this.parser.formatTimestamp(previousTime)} to ${this.parser.formatTimestamp(currentTime)}`)
				gResets.shift()
			}

			while (charges < maxCharges && this.downtime.isDowntime(currentTime)) {
				this.debug(`Saving charge during downtime at ${this.parser.formatTimestamp(currentTime)}. ${charges} charges stored`)

				const window = this.downtime.getDowntimeWindows(currentTime)[0]
				if (window.end < currentTime + step) {
					count += charges
					this.debug(`Delayed charge spend at ${this.parser.formatTimestamp(window.end)}. ${charges} charges spent. No charge time lost. Count: ${count}`)
					charges = 0
				}

				currentTime += step
				charges += 1
			}

			// full charges were built up during a downtime.  Move to the end of the downtime to spend charges.
			if (this.downtime.isDowntime(currentTime)) {
				const window = this.downtime.getDowntimeWindows(currentTime)[0]
				this.debug(`Downtime detected at ${this.parser.formatTimestamp(currentTime)} in window from ${this.parser.formatTimestamp(window.start)} to ${this.parser.formatTimestamp(window.end)}`)

				const matchingDtUsage = dtUsages.find(uw => uw.end === window.end)
				if (matchingDtUsage === undefined) {
					currentTime = window.end
				} else {
					// remove this usage from the list to prevent an infinite loop
					// if the skill comes back off cooldown during the same downtime.
					dtUsages.splice(dtUsages.indexOf(matchingDtUsage), 1)

					this.debug(`Usage detected during downtime at ${this.parser.formatTimestamp(matchingDtUsage.start)}.`)
					currentTime = matchingDtUsage.start
				}

				// TODO: time after window end before usage.  should it just be first use offset? depends on what else was delayed and state in rotation
			}
		}
		this.debug(`Total count for group ${gRep.name} is ${count}. Total reset time lost is ${this.parser.formatDuration(timeLost)}.`)

		return count
	}
}
