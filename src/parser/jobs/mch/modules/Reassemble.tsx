import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

// These are the only GCDs that should be reassembled under normal circumstances
const REASSEMBLE_GCDS: ActionKey[] = [
	'AIR_ANCHOR',
	'AUTO_CROSSBOW',
	'DRILL',
	'SPREAD_SHOT',
]

const OTHER_GCDS: ActionKey[] = [
	'BIOBLASTER',
	'HEAT_BLAST',
	'HEATED_SPLIT_SHOT',
	'HEATED_SLUG_SHOT',
	'HEATED_CLEAN_SHOT',
]

const SEVERITIES = {
	BAD_USES: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		3: SEVERITY.MAJOR,
	},
	DROPPED_USES: {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	},
}

interface ReassembleState {
	active: boolean
	lastGcdTime: number
	gcdHook?: EventHook<Events['action']>
}

interface ReassembleHistory {
	badUses: number
	droppedUses: number
}

export class Reassemble extends Analyser {
	static override handle = 'reassemble'

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private state: ReassembleState = {active: false, lastGcdTime: 0}
	private history: ReassembleHistory = {badUses: 0, droppedUses: 0}

	private reassembleGcdIds = REASSEMBLE_GCDS.map(key => this.data.actions[key].id)
	private otherGcdIds = OTHER_GCDS.map(key => this.data.actions[key].id)

	private gcdFilter = filter<Event>()
		.source(this.parser.actor.id)
		.type('action')
		.action(oneOf([...this.reassembleGcdIds, ...this.otherGcdIds]))

	override initialise() {
		const reassembleFilter = filter<Event>()
			.source(this.parser.actor.id)
			.status(this.data.statuses.REASSEMBLED.id)

		this.addEventHook(reassembleFilter.type('statusApply'), this.onReassemble)
		this.addEventHook(reassembleFilter.type('statusRemove'), this.onRemove)
		this.addEventHook('complete', this.onComplete)
	}

	private onReassemble() {
		if (this.state.active) {
			this.history.droppedUses += 1
		}
		this.state.gcdHook = this.addEventHook(this.gcdFilter, this.onCast)
		this.state.active = true
	}

	private onCast(event: Events['action']) {
		if (this.state.active && !this.reassembleGcdIds.includes(event.action)) {
			this.history.badUses += 1
		}
		this.state.lastGcdTime = event.timestamp
	}

	private onRemove(event: Events['statusRemove']) {
		if (event.timestamp !== this.state.lastGcdTime) {
			this.history.droppedUses += 1
		}
		if (this.state.gcdHook != null) {
			this.removeEventHook(this.state.gcdHook)
		}
		this.state.active = false
	}

	onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.REASSEMBLE.icon,
			content: <Trans id="mch.reassemble.suggestions.bad-gcds.content">
				On single targets <DataLink action="REASSEMBLE" /> should only ever be used on <DataLink action="DRILL" /> and <DataLink action="AIR_ANCHOR" />, as they're your strongest GCDs by a large margin.
			</Trans>,
			tiers: SEVERITIES.BAD_USES,
			value: this.history.badUses,
			why: <Trans id="mch.reassemble.suggestions.bad-gcds.why">
				You used Reassemble on a non-optimal GCD <Plural value={this.history.badUses} one="# time" other="# times"/>.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.REASSEMBLE.icon,
			content: <Trans id="mch.reassemble.suggestions.dropped.content">
				Avoid using <DataLink action="REASSEMBLE" /> when a boss is about to go untargetable so you don't waste the buff.
			</Trans>,
			tiers: SEVERITIES.DROPPED_USES,
			value: this.history.droppedUses,
			why: <Trans id="mch.reassemble.suggestions.dropped.why">
				You allowed Reassemble to fall off unused <Plural value={this.history.droppedUses} one="# time" other="# times"/>.
			</Trans>,
		}))
	}
}
