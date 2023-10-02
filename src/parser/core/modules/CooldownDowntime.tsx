import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {dependency} from 'parser/core/Injectable'
import {Requirement, Rule} from 'parser/core/modules/Checklist'
import React from 'react'
import {Analyser, DisplayOrder} from '../Analyser'
import {filter, oneOf} from '../filter'
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
	/**
	 * The weighted importance of the given CooldownGroup
	 * Set this higher or lower than the other CooldownGroups to adjust the priority
	 * when calculating the checklist percentage
	 */
	weight?: number
}

const DEFAULT_CHECKLIST_TARGET = 95
const DEFAULT_ALLOWED_AVERAGE_DOWNTIME = 1250

export abstract class CooldownDowntime extends Analyser {
	static override handle = 'cooldownDowntime'
	static override title = t('core.cooldownDowntime.title')`Cooldown Downtime`
	static override debug = false

	@dependency protected data!: Data
	@dependency private downtime!: Downtime
	@dependency private checklist!: Checklist

	/**
	 * Jobs MUST provide a list of tracked DPS cooldowns
	 */
	protected abstract trackedCds: CooldownGroup[]

	/**
	 * Jobs may provide a list of cooldowns that won't appear in the checklist, but may still warrant suggestions regarding their use
	 */
	protected suggestionOnlyCooldowns: CooldownGroup[] = []

	private get allCooldowns(): CooldownGroup[] {
		return this.trackedCds.concat(this.suggestionOnlyCooldowns)
	}

	private usages = new Map<CooldownGroup, Array<Events['action']>>()
	private resets = new Map<CooldownGroup, Array<Events['action']>>()

	protected checklistName = <Trans id="core.cooldownDowntime.use-ogcd-cds">Use your cooldowns</Trans>
	protected checklistDescription = <Trans id="core.cooldownDowntime.ogcd-cd-metric">Always make sure to use your actions
		when they are available, but do not clip your GCD to use them.</Trans>
	protected checklistTarget = DEFAULT_CHECKLIST_TARGET

	protected defaultAllowedAverageDowntime = DEFAULT_ALLOWED_AVERAGE_DOWNTIME
	protected defaultFirstUseOffset = 0

	protected trackedDisplayOrder = DisplayOrder.DEFAULT //to allow for more flexible ordering in the checklist

	/**
	 * Jobs MAY filter out some usages as 'fake' usages of a cooldown.
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
	protected countUsage(_event: Events['action']): boolean {
		return true
	}

	override initialise() {
		const trackedIds = this.allCooldowns.map(group => group.cooldowns)
			.reduce((acc, cur) => acc.concat(cur))
			.map(action => action.id)

		const resetIds = this.allCooldowns
			.map(group => group.resetBy?.actions ?? [])
			.reduce((acc, cur) => acc.concat(cur))
			.map(action => action.id)

		const baseFilter = filter<Event>()
			.type('action')
			.source(this.parser.actor.id)

		this.addEventHook(
			baseFilter.action(oneOf(trackedIds)),
			this.onTrackedCast,
		)
		this.addEventHook(
			baseFilter.action(oneOf(resetIds)),
			this.onResetCast,
		)
		this.addEventHook('complete', this.onComplete)

		this.allCooldowns.forEach(group => {
			this.usages.set(group, [])
			this.resets.set(group, [])
		})
	}

	protected onTrackedCast(event: Events['action']) {
		if (!this.countUsage(event)) {
			return
		}

		const group = this.getTrackedGroup(event.action)
		if (group === undefined) {
			return
		}

		(this.usages.get(group) || []).push(event)
	}

	private getTrackedGroup(abilityId: number): CooldownGroup | undefined {
		return this.allCooldowns.find(group => group.cooldowns.find(action => action.id === abilityId) !== undefined)
	}

	private onResetCast(event: Events['action']) {
		this.allCooldowns.forEach(group => {
			if (group.resetBy?.actions.find(action => action.id === event.action)) {
				(this.resets.get(group) ?? []).push(event)
			}
		})
	}

	protected onComplete() {
		const cdRequirements = []
		for (const cdGroup of this.trackedCds) {
			cdRequirements.push(this.createRequirement(cdGroup))
		}

		this.checklist.add(new WeightedRule({
			name: this.checklistName,
			description: this.checklistDescription,
			requirements: cdRequirements,
			target: this.checklistTarget,
			displayOrder: this.trackedDisplayOrder,
		}))
		this.addJobSuggestions()
	}

	private createRequirement(cdGroup: CooldownGroup): Requirement {
		const expected = this.calculateMaxUsages(cdGroup)
		const actual = this.calculateUsageCount(cdGroup)
		let percent = actual / expected * 100
		if (process.env.NODE_ENV === 'production') {
			percent = Math.min(percent, 100)
		}
		const requirementDisplay = cdGroup.cooldowns.map((val, ix) => <>
			{(ix > 0 ? ', ' : '')}
			<ActionLink {...this.data.getAction(val.id)} />
		</>)
		this.debug(JSON.stringify(requirementDisplay))

		return new Requirement({
			name: requirementDisplay,
			percent: percent,
			overrideDisplay: `${actual} / ${expected} (${percent.toFixed(2)}%)`,
			weight: cdGroup.weight ?? 1,
		})
	}

	/** Override to provide additional suggestions (intended for jobs that track skills that should not have weight in the checklist, like healer mitigation cooldowns) */
	protected addJobSuggestions() {
		return
	}

	protected calculateUsageCount(group: CooldownGroup): number {
		return (this.usages.get(group) ?? []).length
	}

	/** Calculates the maximum possible uses for a given cooldown group */
	public calculateMaxUsages(group: CooldownGroup): number {
		const gRep = group.cooldowns[0]
		if (gRep.cooldown === undefined) {
			return 0
		}
		// 0 charges is nonsensical at this point, default up to 1.
		const maxCharges = gRep.charges || 1

		// Skill with charges get their allowed downtime from the charge build up time,
		// so ignore the value on the group object
		const step = gRep.cooldown + ((maxCharges > 1) ? 0 : (group.allowedAverageDowntime ?? this.defaultAllowedAverageDowntime))

		const gResets = this.resets.get(group) ?? []
		const gUsages = (this.usages.get(group) ?? [])
		const dtUsages = gUsages
			.filter(u => this.downtime.isDowntime(u.timestamp))
			.map(u => this.downtime.getDowntimeWindows(u.timestamp)[0])
		const resetTime = (group.resetBy && group.resetBy.refundAmount) ? group.resetBy.refundAmount : 0

		let timeLost = 0 // TODO: this variable is for logging only and does not actually affect the final count

		this.debug(`Checking downtime for group ${gRep.name} with default first use ${group.firstUseOffset} and step ${step} and ${maxCharges} charges`)
		let charges = maxCharges
		let count = 0
		const expectedFirstUseTime = this.parser.pull.timestamp + (group.firstUseOffset ?? this.defaultFirstUseOffset)
		const actualFirstUseTime = gUsages[0]
		const pullEndTimestamp = this.parser.pull.timestamp + this.parser.pull.duration

		let currentTime = expectedFirstUseTime
		if ((group.firstUseOffset ?? 0) < 0 && maxCharges === 1) {
			// check for pre-fight usages, which cause synthesized usage events
			// that will have timestamps that don't accurartely indicated when
			// exactly they were used pre-fight
			const actualSecondUseTime = gUsages[1]
			if (actualSecondUseTime && (actualSecondUseTime.timestamp - actualFirstUseTime.timestamp) < gRep.cooldown) {
				this.debug(`Assumed first use of skill ${gRep.name} at ${this.parser.formatEpochTimestamp(actualSecondUseTime.timestamp - gRep.cooldown)}`)
				this.debug(`Actual second use of skill ${gRep.name} at ${this.parser.formatEpochTimestamp(actualSecondUseTime.timestamp)}`)
				count += 1 // add in the pre-fight usage
				currentTime = actualSecondUseTime.timestamp
			} else if (actualFirstUseTime) {
				// If the actual second usage isn't early enough to suggest an actual pre-fight usage, follow normal logic.
				// Start at the earlier of the actual first use or the expected first use
				this.debug(`Actual first use of skill ${gRep.name} at ${this.parser.formatEpochTimestamp(actualFirstUseTime.timestamp)}`)
				currentTime = Math.min(actualFirstUseTime.timestamp, expectedFirstUseTime)
			}
		} else if (actualFirstUseTime) {
			// Start at the earlier of the actual first use or the expected first use
			this.debug(`Actual first use of skill ${gRep.name} at ${this.parser.formatEpochTimestamp(actualFirstUseTime.timestamp)}`)
			currentTime = Math.min(actualFirstUseTime.timestamp, expectedFirstUseTime)
		}

		while (currentTime < pullEndTimestamp) {
			// spend accumulated charges
			count += charges
			this.debug(`Expected ${charges} usages at ${this.parser.formatEpochTimestamp(currentTime)}. Count: ${count}`)
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
				this.debug(`Reset (${this.data.getAction(rs.action)?.name}) used at ${this.parser.formatEpochTimestamp(rs.timestamp)}. Changing next charge time from ${this.parser.formatEpochTimestamp(previousTime)} to ${this.parser.formatEpochTimestamp(currentTime)}`)
				gResets.shift()
			}

			while (
				currentTime < pullEndTimestamp
				&& charges < maxCharges
				&& this.downtime.isDowntime(currentTime)
			) {
				this.debug(`Saving charge during downtime at ${this.parser.formatEpochTimestamp(currentTime)}. ${charges} charges stored`)

				const window = this.downtime.getDowntimeWindows(currentTime)[0]
				if (window.end < currentTime + step) {
					count += charges
					this.debug(`Delayed charge spend at ${this.parser.formatEpochTimestamp(window.end)}. ${charges} charges spent. No charge time lost. Count: ${count}`)
					charges = 0
				}

				currentTime += step
				charges += 1
			}

			// full charges were built up during a downtime.  Move to the end of the downtime to spend charges.
			if (
				currentTime < pullEndTimestamp
				&& this.downtime.isDowntime(currentTime)
			) {
				const window = this.downtime.getDowntimeWindows(currentTime)[0]
				this.debug(`Downtime detected at ${this.parser.formatEpochTimestamp(currentTime)} in window from ${this.parser.formatEpochTimestamp(window.start)} to ${this.parser.formatEpochTimestamp(window.end)}`)

				const matchingDtUsage = dtUsages.find(uw => uw.end === window.end)
				if (matchingDtUsage === undefined) {
					currentTime = window.end
				} else {
					// remove this usage from the list to prevent an infinite loop
					// if the skill comes back off cooldown during the same downtime.
					dtUsages.splice(dtUsages.indexOf(matchingDtUsage), 1)

					this.debug(`Usage detected during downtime at ${this.parser.formatEpochTimestamp(matchingDtUsage.start)}.`)
					currentTime = matchingDtUsage.start
				}

				// TODO: time after window end before usage.  should it just be first use offset? depends on what else was delayed and state in rotation
			}
		}
		this.debug(`Total count for group ${gRep.name} is ${count}. Total reset time lost is ${this.parser.formatDuration(timeLost)}.`)

		return count
	}
}

class WeightedRule extends Rule {
	constructor(options: TODO) {
		super({...options})

		const totalWeight = this.requirements.reduce((acc, req) => acc + req.weight, 0)
		this.requirements.map(req => req.weight = req.weight / totalWeight)
	}

	public override get percent(): number {
		return this.requirements.reduce((acc, req) => acc + (req.percent * req.weight), 0)
	}
}
