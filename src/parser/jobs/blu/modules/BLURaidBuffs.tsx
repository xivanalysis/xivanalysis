import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink, DataLink, StatusLink} from 'components/ui/DbLink'
import {BlueAction} from 'data/ACTIONS/root/BLU'
import {Status} from 'data/STATUSES'
import {Event, Events, DamageType} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {History} from 'parser/core/modules/ActionWindow/History'
import {Actor, Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import React, {Fragment} from 'react'
import {Team} from 'report'
import {Message, Button, Table} from 'semantic-ui-react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

// BLU has *five* raid buffs. All of them behave essentially
// like a NIN's Mug, applying a debuff on the boss that
// increases damage, however, four of them actually have a
// catch to them:
//
//  Off-guard:            Increases all damage taken by 5%
//  Peculiar Light:       Increases magical damage taken by 5%
//  Physical Attenuation: Increases all physical damage taken by 5%
//  Astral Attenuation:   Increases damage taken (but only for certain spells) by 5%
//  Umbral Attenuation:   Increases damage taken (but only for certain spells) by 5%
//
// Besides Off-guard, the others have specific conditions, so their
// effect varies wildly based on spell loadouts and bursts windows.
//
// In addition to that, the three Attenuation effects from
// Condensed Libra are random, and overwrite eachother.
//
// While all three of the buffs stack, they all also behave like
// Addle / Feint / Reprisal -- you can only have one instance of
// the buff on the boss, and re-applying it overwrites the current one.
//
// So for Off-guard and Peculiar Light, we want to look into two things:
//
//      1. Check that people aren't overwriting eachother's buffs
//      2. Check that the buffs are actually a DPS gain; for example
//         using Peculiar Light during a Revenge Blast window is
//         just lost damage, since Revenge Blast is physical.
//
// For the Libra effects, we should never check for overwrites,
// since fishing for Physical Libra is common and a DPS gain
// in some situations (long revenge blast windows, or before stinging)

interface BuffedEvent {
	action: number, // action ID
	underPL: boolean,
	underOG: boolean,
	underLibra: boolean,
}

interface BuffWindow {
	buffAction: BlueAction,
	buffId: Status['id'],
	isBuffedAction(arg0: BlueAction, arg1: number): boolean,
	events: BuffedEvent[],
	overwritten: boolean,
	ours: boolean,
}

// TODO: export these
const UMBRAL = 1
const ASTRAL = 2

const allowedBuffOverwriteMs = 2000 // Probably too high?
const dupedEventThresholdMs = 100
const fallbackBuffDuration = 15000

export class BLURaidBuffs extends Analyser {
	static override handle = 'buffwindows'
	static override title = t('blu.buffs.title')`Buff Windows`
	static override displayOrder = DISPLAY_ORDER.RAID_BUFFS

	@dependency private actors!: Actors
	@dependency private data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline

	private inOffGuard = false
	private inPeculiarLight = false
	private inLibra = false

	private buffHistory: {[key: number]: History<BuffWindow>} = {}
	private buffActionHook?: EventHook<Events['action']>

	private PECULIAR_LIGHT_ID = this.data.statuses.PECULIAR_LIGHT.id
	private OFF_GUARD_ID = this.data.statuses.OFF_GUARD.id
	private CONDENSED_LIBRA_ASTRAL_ID = this.data.statuses.CONDENSED_LIBRA_ASTRAL.id
	private CONDENSED_LIBRA_UMBRAL_ID = this.data.statuses.CONDENSED_LIBRA_UMBRAL.id
	private CONDENSED_LIBRA_PHYSICAL_ID = this.data.statuses.CONDENSED_LIBRA_PHYSICAL.id

	private newBuffHistory(st: BlueAction, fn: (arg0: BlueAction, arg1: number) => boolean) {
		return new History<BuffWindow>(
			() => ({
				buffAction: st,
				isBuffedAction: fn,
				buffId: 0,
				events: [],
				overwritten: false,
				ours: false,
			})
		)
	}

	override initialise() {
		super.initialise()

		this.buffHistory[this.data.statuses.OFF_GUARD.id] = this.newBuffHistory(
			this.data.actions.OFF_GUARD,
			() => { return true }, // buffs everything
		)
		this.buffHistory[this.data.statuses.PECULIAR_LIGHT.id] = this.newBuffHistory(
			this.data.actions.PECULIAR_LIGHT,
			(action) => {
				return action.damageType === DamageType.MAGICAL
			},
		)

		const CONDENSED_LIBRA_ASTRAL_ID = this.CONDENSED_LIBRA_ASTRAL_ID
		const CONDENSED_LIBRA_UMBRAL_ID = this.CONDENSED_LIBRA_UMBRAL_ID
		const CONDENSED_LIBRA_PHYSICAL_ID = this.CONDENSED_LIBRA_PHYSICAL_ID
		const libraIsBuffed = function(action: BlueAction, buffId: Status['id']): boolean {
			if (buffId === CONDENSED_LIBRA_PHYSICAL_ID) {
				const damageType = action.damageType ?? DamageType.MAGICAL
				return damageType === DamageType.PHYSICAL
			}

			const attackElement = action.elementType
			if (attackElement === undefined) {
				return false
			}
			switch (buffId) {
			case CONDENSED_LIBRA_ASTRAL_ID:
				return attackElement === ASTRAL
				break
			case CONDENSED_LIBRA_UMBRAL_ID:
				return attackElement === UMBRAL
				break
			}
			return false
		}
		const libraAction = this.data.actions.CONDENSED_LIBRA
		this.buffHistory[CONDENSED_LIBRA_ASTRAL_ID] = this.newBuffHistory(libraAction, libraIsBuffed)
		this.buffHistory[CONDENSED_LIBRA_UMBRAL_ID] = this.newBuffHistory(libraAction, libraIsBuffed)
		this.buffHistory[CONDENSED_LIBRA_PHYSICAL_ID] = this.newBuffHistory(libraAction, libraIsBuffed)

		const statusFilter = filter<Event>()
			.status(oneOf(Object.keys(this.buffHistory).map(Number)))
			.target((target: Actor['id']): target is Actor['id'] => {
				// Match all foes, but only the parsed actor of the friends.
				const actor = this.actors.get(target)
				if (actor.team === Team.FRIEND) {
					return false
				}
				return true
			})
		this.addEventHook(statusFilter.type('statusApply'), this.onApplyRaidBuff)
		this.addEventHook(statusFilter.type('statusRemove'), this.onRemoveRaidBuff)

		this.addEventHook('complete', this.onComplete)
	}

	private isDupedEvent(cur: Events['statusApply'] | Events['statusRemove'], prev?: Events['statusApply'] | Events['statusRemove']): boolean {
		if (prev === undefined) {
			return false
		}
		// Duped event, seems to happen for BLU debuffs applied to the boss,
		// like the effects from Bad Breath, Magic Hammer, Off-guard, and
		// Peculiar Light.
		// There's a note deduplicateStatus.ts which seems to explain this.
		// Just do a basic dedup here:
		if (
			cur.status === prev.status
			&& cur.source === prev.source
		) {
			const timestampDelta = cur.timestamp - prev.timestamp
			if (timestampDelta >= -dupedEventThresholdMs && timestampDelta <= dupedEventThresholdMs) {
				return true
			}
		}
		return false
	}

	private previousApply?: Events['statusApply']
	private onApplyRaidBuff(event: Events['statusApply']) {
		if (this.isDupedEvent(event, this.previousApply)) {
			// Duped event, skip it
			return
		}
		this.previousApply = event

		const appliedBuffHistory = this.buffHistory[event.status]
		const currentBuff = appliedBuffHistory.getCurrent()
		if (currentBuff !== undefined) {
			// This is overwriting the current Off-guard/Peculiar Light. This *might* be fine -- let's see
			// how much time was left on the buff
			const timeLeftMs = currentBuff.start - event.timestamp
			if (timeLeftMs > allowedBuffOverwriteMs) {
				currentBuff.data.overwritten = true
			}
			appliedBuffHistory.closeCurrent(event.timestamp)
		}

		switch (event.status) {
		case (this.OFF_GUARD_ID):
			this.inOffGuard = true
			break
		case (this.PECULIAR_LIGHT_ID):
			this.inPeculiarLight = true
			break
		case (this.CONDENSED_LIBRA_ASTRAL_ID):
		case (this.CONDENSED_LIBRA_UMBRAL_ID):
		case (this.CONDENSED_LIBRA_PHYSICAL_ID):
			this.inLibra = true
			break
		}

		const newBuff = appliedBuffHistory.openNew(event.timestamp)
		newBuff.data.buffId = event.status
		if (event.source === this.actors.current.id) {
			newBuff.data.ours = true
		}

		if (this.buffActionHook !== undefined) {
			// There's already a hook installed, likely due to an overwrite.
			// The hooks are identical, so we can just return early
			return
		}

		// No hook installed, so put in our own:
		const playerTargets = this.parser.pull.actors
			.filter(actor => actor.team === Team.FRIEND)
			.map(actor => actor.id)

		const playerActionFilter = filter<Event>().source(oneOf(playerTargets)).type('action')
		this.buffActionHook = this.addEventHook(playerActionFilter, this.onActionDuringBuff)
	}

	private previousRemove?: Events['statusRemove']
	private onRemoveRaidBuff(event: Events['statusRemove']) {
		if (this.isDupedEvent(event, this.previousRemove)) {
			// Duped event, skip it
			return
		}
		this.previousRemove = event

		const removedBuff = this.data.getStatus(event.status)
		if (removedBuff === undefined) { return }

		const removedBuffHistory = this.buffHistory[event.status]

		// Was this an overwrite, or did it run its full course?
		const currentBuff = removedBuffHistory.getCurrent()
		if (currentBuff !== undefined && removedBuff !== undefined) {
			const buffExpectedDuration = (removedBuff.duration ?? fallbackBuffDuration) - allowedBuffOverwriteMs
			const buffActualDuration = event.timestamp - currentBuff.start
			if (buffExpectedDuration > buffActualDuration) {
				currentBuff.data.overwritten = true
				// An overwrite...
			} else {
				// Not an overwrite, this was the buff expiring
				switch (event.status) {
				case this.OFF_GUARD_ID:
					this.inOffGuard = false
					break
				case this.PECULIAR_LIGHT_ID:
					this.inPeculiarLight = false
					break
				case (this.CONDENSED_LIBRA_ASTRAL_ID):
				case (this.CONDENSED_LIBRA_UMBRAL_ID):
				case (this.CONDENSED_LIBRA_PHYSICAL_ID):
					this.inLibra = false
					break
				}
			}
		}

		removedBuffHistory.closeCurrent(event.timestamp)
		const canRemoveHook = !this.inPeculiarLight && !this.inOffGuard && !this.inLibra

		if (this.buffActionHook != null && canRemoveHook) {
			this.removeEventHook(this.buffActionHook)
			this.buffActionHook = undefined
		}
	}

	private onActionDuringBuff(event: Events['action']) {
		Object.values(this.buffHistory).forEach(history => {
			const buffCurrent = history.getCurrent()
			if (buffCurrent === undefined) { return }
			buffCurrent.data.events.push({
				action: event.action,
				underPL: this.inPeculiarLight,
				underOG: this.inOffGuard,
				underLibra: this.inLibra,
			})
		})
	}

	private onComplete() {
		Object.values(this.buffHistory).forEach(history => {
			history.closeCurrent(this.parser.pull.timestamp + this.parser.pull.duration)
		})

		// We should not report overwrites for Condensed Libra since it's quite common to fish
		// for physical libra
		const reportOverwrite = [
			this.data.statuses.PECULIAR_LIGHT,
			this.data.statuses.OFF_GUARD,
		]
		reportOverwrite.forEach(buff => {
			const history = this.buffHistory[buff.id]
			const ourOverwritten = history.entries
				.filter(b => b.data.overwritten && b.data.ours)
				.length

			// TODO best to show seconds overwritten rather than just the count tbh
			this.suggestions.add(new TieredSuggestion({
				icon: buff.icon,
				content: <Trans id="blu.buffs.overwritten.content" >
					Your <StatusLink {...buff} /> was overwritten by someone else before it ran out. This might be reasonable depending on the fight, but worth examining and figuring out if your team needs to coordinate buffs.
				</Trans>,
				tiers: {1: SEVERITY.MEDIUM},
				value: ourOverwritten,
				why: <Trans id="blu.buffs.overwritten.why" >
					<Plural value={ourOverwritten} one="# application was " other="# applications were" /> overwritten by someone else
				</Trans>,
			}))
		})
	}

	override output() {
		const allBuffs = Object.values(this.buffHistory).map(e => e.entries).flat()
			.sort((a, b) => {
				return a.start - b.start
			})
		if (allBuffs.length === 0) { return undefined }

		const ourBuffs = allBuffs.filter(pl => pl.data.ours)
		if (ourBuffs.length === 0) { return undefined }

		const rotationData = ourBuffs.map(buffWindow => {
			const buffStart = buffWindow.start - this.parser.pull.timestamp
			const buffEnd = (buffWindow.end ?? buffWindow.start) - this.parser.pull.timestamp

			const buffId = buffWindow.data.buffId
			const isBuffedAction = buffWindow.data.isBuffedAction
			const relevantActionsBuffed = buffWindow.data.events.filter(e => {
				const action = this.data.getAction(e.action)
				if (action === undefined) { return }
				const damageType = action?.damageType
				if (damageType === undefined) {
					// This filters out all the non-damaging actions, ala Bristle or Whistle
					return
				}
				if (isBuffedAction(action, buffId)) {
					// This buff covers this action
					return true
				}
				return
			})

			let ogBuffed = 0
			let plBuffed = 0
			let libraBuffed = 0
			relevantActionsBuffed.forEach(e => {
				if (e.underPL) {
					plBuffed++
				}
				if (e.underOG) {
					ogBuffed++
				}
				if (e.underLibra) {
					libraBuffed++
				}
				return
			})
			return {
				start: buffStart,
				end: buffEnd,
				buffAction: buffWindow.data.buffAction,
				buffStatus: this.data.getStatus(buffId),
				ogBuffed: ogBuffed,
				plBuffed: plBuffed,
				libraBuffed: libraBuffed,
			}
		}).filter(e => e !== undefined)

		if (rotationData.length === 0) { return }

		return <Fragment>
			<Message>
				<Trans id="blu.buffs.table.message">
				Blue Mages can keep both <ActionLink action="OFF_GUARD"/> and <ActionLink action="PECULIAR_LIGHT"/> up for the entire duration of the fight, and may opt to have the <ActionLink action="CONDENSED_LIBRA"/> buffs running as well.
					<br />
				The table below shows when you used your buffs, as well as how many damaging party actions the buff covered. It also shows how many of those actions were also covered by the other two buffs. Ideally your team should coordinate to have <ActionLink action="OFF_GUARD" showIcon={false} /> and <ActionLink action="PECULIAR_LIGHT" showIcon={false} /> running all the time, making both numbers below equal.
				</Trans>
			</Message>
			<Table compact unstackable celled collapsing>
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell><Trans id="blu.buffs.buff_time">Time</Trans></Table.HeaderCell>
						<Table.HeaderCell><Trans id="blu.buffs.buff_yours">Your Buff</Trans></Table.HeaderCell>
						<Table.HeaderCell><DataLink action="OFF_GUARD" /></Table.HeaderCell>
						<Table.HeaderCell><DataLink action="PECULIAR_LIGHT" /></Table.HeaderCell>
						<Table.HeaderCell><DataLink action="CONDENSED_LIBRA" /></Table.HeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{rotationData.map(a => {
						return <Table.Row key={a.start}>
							<Table.Cell textAlign="center">
								<span style={{marginRight: 5}}>{this.parser.formatEpochTimestamp(a.start + this.parser.pull.timestamp)}</span>
								<Button
									circular
									compact
									size="mini"
									icon="time"
									onClick={() => this.timeline.show(a.start, a.end)}
								/>
							</Table.Cell>
							<Table.Cell> <StatusLink {...a.buffStatus} />
							</Table.Cell>
							<Table.Cell>{a.ogBuffed}</Table.Cell>
							<Table.Cell>{a.plBuffed}</Table.Cell>
							<Table.Cell>{a.libraBuffed}</Table.Cell>
						</Table.Row>
					})}
				</Table.Body>
			</Table>
		</Fragment>
	}
}

