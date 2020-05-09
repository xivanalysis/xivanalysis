import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import {ActionLink} from 'components/ui/DbLink'
import {Data} from 'parser/core/modules/Data'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import Suggestions, {SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'
import UnableToAct from 'parser/core/modules/UnableToAct'
import {CastEvent, BuffEvent} from 'fflogs'

// TODO: Figure out how to check CD of Draw before Sleeve Draw is cast
// TODO: Ensure Sleeve Draw is used with an empty hand

// Amount of time it's okay to hold off Sleeve Draw (SD)
const EXCUSED_HOLD_DEFAULT = 1500

export default class SleeveDraw extends Module {
	static handle = 'sleeve-draw'
	static title = t('ast.sleeve-draw.title')`Sleeve Draw`

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private checklist!: Checklist
	@dependency private unableToAct!: UnableToAct

	private uses = 0
	private lastUse = 0
	private totalHeld = 0
	private excusedHeld = 0

	init() {
		this.addEventHook('cast', {by: 'player', abilityId: [this.data.actions.SLEEVE_DRAW.id]}, this.onCast)
		this.addEventHook(['applybuff', 'refreshbuff', 'removebuff'], {by: 'player', abilityId: [this.data.statuses.SLEEVE_DRAW.id]}, this.onBuff)
		// this.addEventHook('applybuffstack', { by: 'player', abilityId: [this.data.statuses.SLEEVE_DRAW.id] }, this.onBuff)
		// this.addEventHook('complete', this._onComplete)
	}

	private onCast(event: CastEvent) {
		this.uses++
		if (this.lastUse === 0) {
			this.lastUse = this.parser.fight.start_time
		}

		const firstOpportunity = this.lastUse + this.data.actions.SLEEVE_DRAW.cooldown*1000
		const held = event.timestamp - firstOpportunity
		if (held > 0) {
			const downtimes = this.unableToAct.getDowntimes(firstOpportunity, firstOpportunity + EXCUSED_HOLD_DEFAULT)
			const firstEnd = downtimes.length ? downtimes[0].end : firstOpportunity
			this.totalHeld += held
			this.excusedHeld += EXCUSED_HOLD_DEFAULT + (firstEnd - firstOpportunity)
		}

		this.lastUse = event.timestamp
	}

	private onBuff(event: BuffEvent) {
		console.log(event)
		console.log(this.parser.formatTimestamp(event.timestamp))
	}

	// _onComplete() {
	// 	const holdDuration = this.uses === 0 ? this.parser.fightDuration : this.totalHeld
	// 	const usesMissed = Math.floor((holdDuration - this.excusedHeld) / (this.data.actions.SLEEVE_DRAW.cooldown * 1000))
	// 	const maxUses = this.uses + usesMissed

	// 	this.checklist.add(new Rule({
	// 		name: <Trans id="ast.sleeve-draw.checklist.name">
	// 			Use Sleeve Draw frequently
	// 		</Trans>,
	// 		description: <Trans id="ast.sleeve-draw.checklist.description">
	// 			More Sleeve Draw uses mean more cards, and we want as many of those as possible.
	// 		</Trans>,
	// 		requirements: [
	// 			new Requirement({
	// 				name: <Trans id="ast.sleeve-draw.checklist.requirement.uses.name">
	// 					<ActionLink {...this.data.actions.SLEEVE_DRAW} /> uses
	// 				</Trans>,
	// 				value: this.uses,
	// 				target: Math.max(maxUses, this.uses, 1),
	// 			}),
	// 		],
	// 	}))
	// }
}
