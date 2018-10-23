import React, {Fragment} from 'react'

import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {ActionLink} from 'components/ui/DbLink'
import {Plural, Trans} from '@lingui/react'
import {TieredRule, Requirement, TARGET} from 'parser/core/modules/Checklist'

const WASTED_USES_MAX_MEDIUM = 2
// const MP_NEEDS_REFRESH_THRESHOLD = 0.80
// const LUCID_DRIFT_ALLOWANCE = 1.1
// const GCDS_HOLDING_LUCID_THRESHOLD = 5

// Lucid seems to recover about 5% of the user's max MP per tick?
// TODO: Find Math supporting the above observation, apply to calculations
export default class LucidDreaming extends Module {
	static handle = 'lucid'
	static dependencies = [
		'checklist',
		// 'combatants',
		'suggestions',
	]

	_lastUse = 0
	_uses = 0
	_totalHeld = 0
	_extensions = 0
	_gcdCountHoldingLucid = 0

	_maxMP = null
	_MP = null
	_MPthresholdTime = null

	constructor(...args) {
		super(...args)

		const _filter = {
			by: 'player',
			abilityId: [ACTIONS.LUCID_DREAMING.id],
		}
		// this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('cast', _filter, this._onCastLucid)
		this.addHook('refreshbuff', {by: 'player', to: 'player'}, this._onRefreshLucid)
		this.addHook('complete', this._onComplete)
	}

	//*** Commented out until mp tracking relevance is determined ***//
	// _onCast(event) {
	// 	const action = getAction(event.ability.guid)

	// 	if (!action.onGcd) {
	// 		return
	// 	}

	// 	// keep track of how long they've been below MP threshold to warrant a Lucid usage
	// 	this._maxMP = this.combatants.selected.resources.maxMP
	// 	this._MP = this.combatants.selected.resources.mp
	// 	console.log(this.parser.formatTimestamp(event.timestamp) + ': ' + this._MP + '/' + this._maxMP)

	// 	if (this._MP < this._maxMP * MP_NEEDS_REFRESH_THRESHOLD) {
	// 		this._MPthresholdTime = this._MPthresholdTime || event.timestamp
	// 	} else {
	// 		this._MPthresholdTime = null
	// 	}

	// 	const isLucidReady = event.timestamp > (this._lastUse === 0 ? this.parser.fight.start_time : this._lastUse) + (ACTIONS.LUCID_DREAMING.cooldown * LUCID_DRIFT_ALLOWANCE * 1000)

	// 	// Looks for a GCD where they held Lucid, even though they had MP below threshold
	// 	// TODO: Could this possibly be made more accurate or relevant?
	// 	// TODO: Flip this around and check if they're wasting ticks on lucid (not relevant for AST)
	// 	if (this._MPthresholdTime
	// 		&& (this._uses === 0 || isLucidReady)) {
	// 		this._gcdCountHoldingLucid++
	// 		console.log('No lucid being used. lastUse: ' + this.parser.formatTimestamp(this._lastUse) + ' Uses: ' + this._uses)
	// 		console.log('time for next Lucid: ' + this.parser.formatTimestamp(this._lastUse + (ACTIONS.LUCID_DREAMING.cooldown * 1000)))
	// 		console.log('time now: ' + this.parser.formatTimestamp(event.timestamp))
	// 	}
	// }

	_onCastLucid(event) {
		this._uses++

		if (this._lastUse === 0) { this._lastUse = this.parser.fight.start_time }

		let _held = 0

		if (this._uses === 1) {
			// The first use, take holding as from the first minute of the fight
			_held = event.timestamp - this.parser.fight.start_time
		} else {
			// Take holding as from the time it comes off cooldown
			_held = event.timestamp - this._lastUse - (ACTIONS.LUCID_DREAMING.cooldown * 1000)
		}

		if (_held > 0) {
			this._totalHeld += _held
		}
		//update the last use
		this._lastUse = event.timestamp
	}

	_onRefreshLucid(event) {
		if (event.ability.guid === STATUSES.LUCID_DREAMING.id) {
			this._extensions++
		}
	}

	_onComplete() {
		// console.log(this)
		//uses missed reported in 1 decimal
		const holdDuration = this._uses === 0 ? this.parser.fightDuration : this._totalHeld
		// console.log(holdDuration)
		// console.log(this.parser.formatDuration(holdDuration))
		const _usesMissed = Math.floor(holdDuration / (ACTIONS.LUCID_DREAMING.cooldown * 1000))
		// console.log('no mp: ' + this._gcdCountHoldingLucid)
		const warnTarget = (this._uses - 1) / this._uses * 100
		const failTarget = (this._uses - 2) / this._uses * 100

		this.checklist.add(new TieredRule({
			name: <Trans id="ast.lucid-dreaming.checklist.name">
				Extend Lucid Dreaming
			</Trans>,
			description: <Trans id="ast.lucid-dreaming.checklist.content">
				Astrologians have a very low MP pool, due to the high cost of their healing spells. If they adhere to "Always be casting" they frequently
				find themselves desiring more MP. It's important to extend all casts of Lucid Dreaming with <ActionLink {...ACTIONS.CELESTIAL_OPPOSITION} /> to maximize MP benefits.
			</Trans>,
			tiers: {[warnTarget]: TARGET.WARN, [failTarget]: TARGET.FAIL, 100: TARGET.SUCCESS},
			requirements: [
				new Requirement({
					name: <Trans id="ast.lucid-dreaming.checklist.requirement.name">
						<ActionLink {...ACTIONS.LUCID_DREAMING} /> extensions
					</Trans>,
					value: this._extensions,
					target: this._uses,
				}),
			],
		}))

		if (_usesMissed > 1 || this._uses === 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.LUCID_DREAMING.icon,
				content: <Fragment>
					<Trans id="ast.lucid-dreaming.suggestion.content">
					Keep <ActionLink {...ACTIONS.LUCID_DREAMING} /> on cooldown for better MP management, unless there's a specific part of the fight you need to drop aggro quick.
					</Trans>
				</Fragment>,
				severity: this._uses === 0 || _usesMissed > WASTED_USES_MAX_MEDIUM ? SEVERITY.MAJOR : SEVERITY.MEDIUM,
				why: <Fragment>
					<Trans id="ast.lucid-dreaming.suggestion.why">
					About <Plural value={_usesMissed} one="# use" other="# uses" /> of Lucid Dreaming were missed by holding it for at least a total of {this.parser.formatDuration(holdDuration)}.
					</Trans>
				</Fragment>,
			}))
		}

		// Specifically look for times where they held it despite having a non-full MP bar.
		// Threshold: LUCID_DRIFT_ALLOWANCE multiplied by cooldown of LUCID_DREAMING (120s)
		// if (this._gcdCountHoldingLucid > GCDS_HOLDING_LUCID_THRESHOLD) {
		// 	this.suggestions.add(new Suggestion({
		// 		icon: ACTIONS.LUCID_DREAMING.icon,
		// 		content: <Fragment>
		// 			GCDs detected where MP could be topped off but <ActionLink {...ACTIONS.LUCID_DREAMING} /> was not used despite it being ready.
		// 		</Fragment>,
		// 		severity: SEVERITY.MAJOR,
		// 		why: <Fragment>
		// 			{this._gcdCountHoldingLucid} GCDs total spent holding Lucid Dreaming with MP below 80%
		// 		</Fragment>,
		// 	}))
		// }

		// Checklist that they extended all their lucids
		// this.checklist.add(new Rule({
		// 	name: 'Extend Lucid Dreaming',
		// 	description: <Fragment>
		// 		<Trans id="ast.lucid-dreaming.checklist.content">
		// 		Astrologians have a very low MP pool, due to the high cost of their healing spells. If they adhere to "Always be casting" they frequently
		// 		find themselves desiring more MP. It's important to extend all casts of Lucid Dreaming with <ActionLink {...ACTIONS.CELESTIAL_OPPOSITION} /> to maximize MP benefits.
		// 		</Trans>
		// 	</Fragment>,
		// 	requirements: [
		// 		new Requirement({
		// 			name: <Fragment><ActionLink {...ACTIONS.LUCID_DREAMING} /> extensions</Fragment>,
		// 			percent: () => this._uses > 0 ? (this._extensions/this._uses) * 100 : 0,
		// 		}),
		// 	],
		// }))

	}

}
