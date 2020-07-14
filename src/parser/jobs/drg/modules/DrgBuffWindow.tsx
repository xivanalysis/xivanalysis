import React, {Fragment} from 'react'
import {MessageDescriptor} from '@lingui/core'
import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {CastEvent, BuffEvent} from 'fflogs'
import {Icon, Message} from 'semantic-ui-react'

import ACTIONS, {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import {Data} from 'parser/core/modules/Data'
import Module, {dependency} from 'parser/core/Module'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import {ActionLink} from 'components/ui/DbLink'
import {RotationTable, RotationTableTargetData, RotationTableNotesMap} from 'components/ui/RotationTable'

// generally, you're not supposed to use drg buffs immediately after these
const BAD_BUFF_ACTIONS = [
	ACTIONS.CHAOS_THRUST.id,
	ACTIONS.FULL_THRUST.id,
]

class BuffWindowHistory {
	start: number
	end?: number
	casts: CastEvent[] = []
	isBad: boolean

	private data: Data

	constructor(data: Data, start: number, isBad: boolean) {
		this.start = start
		this.isBad = isBad
		this.data = data
	}

	get gcds(): number {
		return this.casts
			.map(e => this.data.getAction(e.ability.guid))
			.filter(a => a && a.onGcd)
			.length
	}
}

// the main reason that this doesn't extend core buff windows is that DRG
// needs a few extra hooks to determine if the buff had an optimal placement,
// which requires us to know which GCDs were used immediately before the buff
export abstract class DrgBuffWindowModule extends Module {
	// handle and title need to be set
	static handle: string = 'drgBuffWindow'
	static title: MessageDescriptor = t('drg.buffwindow.title')`Dragoon Buff Window`

	/**
	 * DRG expects 8 GCDs in a window by default
	 */
	protected expectedGcds: number = 8

	/**
	 * Similar to BuffWindow, except DRG takes an array to handle dragon sight
	 */
	abstract buffAction: Action

	/**
	 * Also similar to BuffWindow, the status we should group everything under
	 */
	abstract buffStatus: Status[]

	protected windows: BuffWindowHistory[] = []
	protected current: BuffWindowHistory | undefined

	private lastGcd: Action | undefined

	@dependency protected data!: Data
	@dependency protected suggestions!: Suggestions
	@dependency protected timeline!: Timeline

	private get buffStatusIds() : number[] {
		return this.buffStatus.map(status => status.id)
	}

	private get lastGcdIsBad() : boolean {
		if (this.lastGcd) {
			return BAD_BUFF_ACTIONS.includes(this.lastGcd.id)
		}

		return false
	}

	protected init() {
		this.addEventHook('cast', {by: 'player'}, this.onCast)
		this.addEventHook('applybuff', {to: 'player', abilityId: this.buffStatusIds}, this.onApplyBuff)
		this.addEventHook('removebuff', {to: 'player', abilityId: this.buffStatusIds}, this.onRemoveBuff)
		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent) {
		const action = this.data.getAction(event.ability.guid)

		// apparently we get auto attacks here too?
		if (!action || action.autoAttack) {
			return
		}

		// check if it's a gcd for DRG good buff start tracking
		if (action && action.onGcd) {
			this.lastGcd = action
		}

		// push to active window, if it exists
		if (this.current) {
			this.current.casts.push(event)
		}
	}

	private onApplyBuff(event: BuffEvent) {
		// open a new window
		this.startNewBuffWindow(event.timestamp)
	}

	private onRemoveBuff(event: BuffEvent) {
		if (this.current) {
			this.current.end = event.timestamp
			this.windows.push(this.current)
			this.current = undefined
		}
	}

	// this is a helper because onCast might need to make a new window due to pre-pull buffs?
	private startNewBuffWindow(startTime: number) {
		this.current = new BuffWindowHistory(this.data, startTime, this.lastGcdIsBad)
	}

	protected onComplete() {
		if (this.current) {
			this.current.end = this.parser.fight.end_time
			this.windows.push(this.current)
		}

		const badBuffs = this.windows.filter(window => window.isBad).length
		this.suggestions.add(new TieredSuggestion({
			icon: this.buffAction.icon,
			content: <Trans id="drg.buffwindow.suggestions.bad-gcd">
				Avoid using <ActionLink {...this.buffAction} /> immediately after <ActionLink {...ACTIONS.CHAOS_THRUST}/> or <ActionLink {...ACTIONS.FULL_THRUST}/> in order to get the most possible damage out of each window.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
			},
			value: badBuffs,
			why: <Trans id="drg.buffwindow.suggestions.bad-gcd.why">
				{badBuffs} of your <ActionLink {...this.buffAction} /> windows started right after a standard combo finisher.
			</Trans>,
		}))
	}

	renderTable() {
		if (this.windows.length > 0) {
			const rotationTargets = [{
				header: <Trans id="drg.buffs.gcd-count">GCDs</Trans>,
				accessor: 'gcds',
			}]
			const notesData = [{
				header: <Trans id="drg.buffs.bad-start">Optimal Start</Trans>,
				accessor: 'start',
			}]

			const rotationData = this.windows.map(window => {
				const targets: RotationTableTargetData = {}
				const notes: RotationTableNotesMap = {}
				const windowStart = window.start - this.parser.eventTimeOffset
				const windowEnd = (window.end != null ? window.end : window.start) - this.parser.eventTimeOffset

				targets.gcds = {
					actual: window.gcds,
					expected: this.expectedGcds,
				}

				notes.start = window.isBad ? <Icon name="x" color="red" /> : <Icon name="check" color="green" />

				// partial windows?
				return {
					start: windowStart,
					end: windowEnd,
					targetsData: targets,
					rotation: window.casts,
					notesMap: notes,
				}
			})

			return <Fragment>
				<RotationTable
					targets={rotationTargets}
					data={rotationData}
					onGoto={this.timeline.show}
					notes={notesData}
				/>
			</Fragment>
		} else {
			return <Fragment>
				<Message warning>
					<Trans id="drg.buffs.unused"><ActionLink {...this.buffAction} /> was not used during this fight.</Trans>
				</Message>
			</Fragment>
		}
	}

	output() {
		return this.renderTable()
	}
}
