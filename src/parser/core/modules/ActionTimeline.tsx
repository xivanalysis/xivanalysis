import {Trans} from '@lingui/react'
import {Action} from 'data/ACTIONS'
import React, {ReactNode} from 'react'
import {Icon} from 'semantic-ui-react'
import {ensureArray} from 'utilities'
import {Analyser} from '../Analyser'
import {dependency} from '../Injectable'
import CastTime from './CastTime'
import {ChargeHistoryEntry, CooldownEndReason, CooldownGroup, CooldownHistoryEntry, Cooldowns, SelectionSpecifier} from './Cooldowns2'
import {Data} from './Data'
import {SpeedAdjustments} from './SpeedAdjustments'
import {ActionItem, Row, SimpleItem, SimpleRow, Timeline} from './Timeline'

const ANIMATION_LOCK = 100

// We're excluding the Action interface as it's unessecary for this config format, and complicates the discrimination later.
type RowSpecifierEntry = Exclude<SelectionSpecifier, Action>
export type RowSpecifier = RowSpecifierEntry | RowSpecifierEntry[]
export interface ActionRowConfig {
	content: RowSpecifier
	label?: ReactNode
}
export type ActionRow = RowSpecifier | ActionRowConfig

enum ItemDepth {
	CHARGE_GAIN = 0,
	ACTION = 1,
}

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
		if (typeof finalConfig !== 'object' || Array.isArray(finalConfig)) {
			finalConfig = {content: finalConfig}
		}

		// Pre-emptively grab the cooldown history, we might need it for the label
		const content = ensureArray(finalConfig.content)
		const cooldownHistory = content.flatMap(specifier => this.cooldowns.cooldownHistory(specifier))

		// Using an IIFE because pattern matching isn't in the spec yet
		const firstContent = content[0]
		const label = (() => {
			if (finalConfig.label != null) { return finalConfig.label }
			if (firstContent === 'GCD')  { return <Trans id="core.action-timeline.label.gcd">GCD</Trans> }
			if (typeof firstContent === 'string') { return this.data.actions[firstContent].name }
			if (typeof firstContent === 'number') { return cooldownHistory[0]?.action.name }
		})()

		// Build the row and save it to the groups for this config
		// TODO: collision handling?
		const row = this.timeline.addRow(new SimpleRow({label}))
		content.flatMap(specifier => this.cooldowns.groups(specifier))
			.forEach(group => this.groupRows.set(group, row))

		// Add all the items
		this.addCooldownItems(row, cooldownHistory)
		this.addChargeItems(row, content.flatMap(specifier => this.cooldowns.chargeHistory(specifier)))
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
					depth: ItemDepth.ACTION,
					start: entry.timestamp - this.parser.pull.timestamp,
					action: entry.action,
				})
				: new SimpleItem({
					depth: ItemDepth.CHARGE_GAIN,
					start: entry.timestamp - this.parser.pull.timestamp,
					content: <div style={{
						width: 1,
						height: '100%',
						background: 'red',
						position: 'relative',
					}}>
						<Icon name="angle double up" style={{
							color: 'blue',
							transform: 'translateX(-50%)',
							position: 'absolute',
							top: '50%',
							lineHeight: 0,
						}}/>
					</div>,
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
