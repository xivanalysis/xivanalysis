import {Trans, Plural} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {ActionRoot} from 'data/ACTIONS/root'
import STATUSES from 'data/STATUSES'
import {CastEvent, BuffEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Combatants from 'parser/core/modules/Combatants'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

// These are the only GCDs that should be reassembled under normal circumstances
const REASSEMBLE_GCDS: Array<keyof ActionRoot> = [
	'AIR_ANCHOR',
	'AUTO_CROSSBOW',
	'DRILL',
	'SPREAD_SHOT',
]

const OTHER_GCDS: Array<keyof ActionRoot> = [
	'BIOBLASTER',
	'HEAT_BLAST',
	'HEATED_SPLIT_SHOT',
	'HEATED_SLUG_SHOT',
	'HEATED_CLEAN_SHOT',
]

export default class Reassemble extends Module {
	static handle = 'reassemble'

	@dependency private combatants!: Combatants
	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private badReassembles = 0
	private droppedReassembles = 0
	private lastUse = 0

	private REASSEMBLE_GCDS: number[] = []
	private OTHER_GCDS: number[] = []

	protected init() {
		this.REASSEMBLE_GCDS = REASSEMBLE_GCDS.map(key => this.data.actions[key].id)
		this.OTHER_GCDS = OTHER_GCDS.map(key => this.data.actions[key].id)

		this.addEventHook('cast', {by: 'player', abilityId: [...this.REASSEMBLE_GCDS, ...this.OTHER_GCDS]}, this.onCast)
		this.addEventHook('removedebuff', {by: 'player', abilityId: STATUSES.REASSEMBLED.id}, this.onRemoveReassemble)
		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent) {
		if (this.combatants.selected.hasStatus(STATUSES.REASSEMBLED.id)) {
			this.badReassembles += this.REASSEMBLE_GCDS.includes(event.ability.guid) ? 0 : 1
		}
		this.lastUse = event.timestamp
	}

	private onRemoveReassemble(event: BuffEvent) {
		if (event.timestamp !== this.lastUse) {
			this.droppedReassembles++
		}
	}

	onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.REASSEMBLE.icon,
			content: <Trans id="mch.reassemble.suggestions.bad-gcds.content">
				On single targets <ActionLink {...this.data.actions.REASSEMBLE}/> should only ever be used on <ActionLink {...this.data.actions.DRILL}/> and <ActionLink {...this.data.actions.AIR_ANCHOR}/>, as they're your strongest GCDs by a large margin.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			value: this.badReassembles,
			why: <Trans id="mch.reassemble.suggestions.bad-gcds.why">
				You used Reassemble on a non-optimal GCD <Plural value= {this.badReassembles} one="# time" other="# times"/>.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.REASSEMBLE.icon,
			content: <Trans id="mch.reassemble.suggestions.dropped.content">
				Avoid using <ActionLink {...this.data.actions.REASSEMBLE}/> when a boss is about to go untargetable so you don't waste the buff.
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
