import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
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
	// 6.0:
	//'CHAIN_SAW',
	//'SCATTER_GUN',
]

const OTHER_GCDS: ActionKey[] = [
	'BIOBLASTER',
	'HEAT_BLAST',
	'HEATED_SPLIT_SHOT',
	'HEATED_SLUG_SHOT',
	'HEATED_CLEAN_SHOT',
]

export class Reassemble extends Analyser {
	static override handle = 'reassemble'

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private badReassembles = 0
	private droppedReassembles = 0
	private lastGcd = 0
	private reassembleActive = false

	private REASSEMBLE_GCDS: number[] = []
	private OTHER_GCDS: number[] = []

	override initialise() {
		this.REASSEMBLE_GCDS = REASSEMBLE_GCDS.map(key => this.data.actions[key].id)
		this.OTHER_GCDS = OTHER_GCDS.map(key => this.data.actions[key].id)

		const reassembleFilter = filter<Event>()
			.source(this.parser.actor.id)
			.status(this.data.statuses.REASSEMBLED.id)

		const gcdFilter = filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
			.action(oneOf([...this.REASSEMBLE_GCDS, ...this.OTHER_GCDS]))

		this.addEventHook(reassembleFilter.type('statusApply'), this.onReassemble)
		this.addEventHook(gcdFilter, this.onCast)
		this.addEventHook(reassembleFilter.type('statusRemove'), this.onRemove)
		this.addEventHook('complete', this.onComplete)
	}

	private onReassemble() {
		if (this.reassembleActive) {
			this.droppedReassembles++
		}
		this.reassembleActive = true
	}

	private onCast(event: Events['action']) {
		if (this.reassembleActive && !this.REASSEMBLE_GCDS.includes(event.action)) {
			this.badReassembles += 1
		}
		this.lastGcd = event.timestamp
	}

	private onRemove(event: Events['statusRemove']) {
		if (event.timestamp !== this.lastGcd) {
			this.droppedReassembles++
		}
		this.reassembleActive = false
	}

	onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.REASSEMBLE.icon,
			content: <Trans id="mch.reassemble.suggestions.bad-gcds.content">
				On single targets <DataLink action="REASSEMBLE" /> should only ever be used on <DataLink action="DRILL" /> and <DataLink action="AIR_ANCHOR" />, as they're your strongest GCDs by a large margin.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: this.badReassembles,
			why: <Trans id="mch.reassemble.suggestions.bad-gcds.why">
				You used Reassemble on a non-optimal GCD <Plural value={this.badReassembles} one="# time" other="# times"/>.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.REASSEMBLE.icon,
			content: <Trans id="mch.reassemble.suggestions.dropped.content">
				Avoid using <DataLink action="REASSEMBLE" /> when a boss is about to go untargetable so you don't waste the buff.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			value: this.droppedReassembles,
			why: <Trans id="mch.reassemble.suggestions.dropped.why">
				You allowed Reassemble to fall off unused <Plural value={this.droppedReassembles} one="# time" other="# times"/>.
			</Trans>,
		}))
	}
}
