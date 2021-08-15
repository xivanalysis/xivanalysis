import {Action} from 'data/ACTIONS'
import React, {ReactNode} from 'react'
import {Analyser} from '../Analyser'
import {dependency} from '../Injectable'
import CastTime from './CastTime'
import {ChargeHistoryEntry, CooldownEndReason, CooldownGroup, CooldownHistoryEntry, Cooldowns, SelectionSpecifier} from './Cooldowns2'
import {Data} from './Data'
import {SpeedAdjustments} from './SpeedAdjustments'
import {ActionItem, Row, SimpleItem, SimpleRow, Timeline} from './Timeline'

const ANIMATION_LOCK = 100

// We're excluding the Action interface as it's unessecary for this config format, and complicates the discrimination later.
export type RowSpecifier = Exclude<SelectionSpecifier, Action>
export interface ActionRowConfig {
	content: RowSpecifier
	label?: ReactNode
}
export type ActionRow = RowSpecifier | ActionRowConfig

export class ActionTimeline extends Analyser {
	static override handle = 'actionTimeline'
	static override debug = false

	@dependency private castTime!: CastTime
	@dependency private cooldowns!: Cooldowns
	@dependency private data!: Data
	@dependency private speedAdjustments!: SpeedAdjustments
	@dependency private timeline!: Timeline

	// TODO: not private
	private order: ActionRow[] = [
	]

	private groupRows = new Map<CooldownGroup, Row>()

	override initialise() {
		this.addEventHook('complete', this.onComplete)
	}

	private onComplete() {
		// Add rows for all the configured entries
		for (const row of this.order) {
			this.addRow(row)
		}

		// Figure out what groups have not been explicitly configured and build rows for them
		this.cooldowns.allGroups()
			.filter(group => !this.groupRows.has(group))
			.forEach(group => this.addRow(group))
	}

	private addRow(config: ActionRow) {
		// Standardise the simple config into the main config shape
		let finalConfig = config
		if (typeof finalConfig !== 'object') {
			finalConfig = {content: finalConfig}
		}

		// Pre-emptively grab the cooldown history, we might need it for the label
		const {content} = finalConfig
		const cooldownHistory = this.cooldowns.cooldownHistory(content)

		// Using an IIFE because pattern matching isn't in the spec yet
		const label = (() => {
			if (finalConfig.label != null) { return finalConfig.label }
			// todo: i18n
			if (content === 'GCD')  { return 'GCD' }
			if (typeof content === 'string') { return this.data.actions[content].name }
			if (typeof content === 'number') { return cooldownHistory[0]?.action.name }
		})()

		// Build the row and save it to the groups for this config
		// TODO: collision handling?
		const row = this.timeline.addRow(new SimpleRow({label}))
		this.cooldowns.groups(content)
			.forEach(group => this.groupRows.set(group, row))

		// Add all the items
		this.addCooldownItems(row, cooldownHistory)
		this.addChargeItems(row, this.cooldowns.chargeHistory(content))
	}

	private addCooldownItems(row: SimpleRow, history: CooldownHistoryEntry[]) {
		for (const entry of history) {
			const duration = this.getCooldownDuration(entry)

			// todo: with the adjusted cast time we might get some overlaps, should we try to avoid that?
			const start = entry.start - this.parser.pull.timestamp
			const end = start + duration
			row.addItem(new SimpleItem({
				start,
				end,
				content: <div style={{background: 'rgba(255, 0, 0, 0.25)', width: '100%', height: '100%'}}/>,
			}))
		}
	}

	private addChargeItems(row: SimpleRow, history: ChargeHistoryEntry[]) {
		for (const entry of history) {
			const item = entry.delta < 0
				? new ActionItem({
					start: entry.timestamp - this.parser.pull.timestamp,
					action: entry.action,
				})
				: new SimpleItem({
					start: entry.timestamp - this.parser.pull.timestamp,
					content: <>{entry.delta}</>,
				})
			row.addItem(item)
		}
	}

	private getCooldownDuration(entry: CooldownHistoryEntry) {
		let duration = entry.end - entry.start

		// If the cooldown expired naturally, it _may_ have a cast time greater than its cooldown.
		if (entry.endReason === CooldownEndReason.EXPIRED) {
			let castTime = this.castTime.forAction(entry.action.id, entry.start) ?? 0

			// If the action has a known speed attribute, adjust for it.
			if (entry.action.speedAttribute != null) {
				// TODO: Speed adjustments should probably be absorbed into castTime.
				castTime = this.speedAdjustments.getAdjustedDuration({
					duration: castTime,
					attribute: entry.action.speedAttribute,
				})
			}

			// We add the animation lock constant to the cast time to mimic the game's
			// behaviour - also sometimes known as "caster tax".
			duration = Math.max(duration, castTime + ANIMATION_LOCK)
		}

		return duration
	}
}
