import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const BAD_LIFE_SURGE_CONSUMERS = [
	ACTIONS.TRUE_THRUST.id,
	ACTIONS.RAIDEN_THRUST.id,
	ACTIONS.VORPAL_THRUST.id,
	ACTIONS.DISEMBOWEL.id,
	ACTIONS.CHAOS_THRUST.id,
	ACTIONS.PIERCING_TALON.id,
	ACTIONS.DOOM_SPIKE.id,
	ACTIONS.SONIC_THRUST.id,
	ACTIONS.COERTHAN_TORMENT.id,
]
const FINAL_COMBO_HITS = [
	ACTIONS.FANG_AND_CLAW.id,
	ACTIONS.WHEELING_THRUST.id,
]

export default class Buffs extends Module {
	static handle = 'buffs'
	static title = t('drg.buffs.title')`Buffs`
	static dependencies = [
		'checklist',
		'combatants',
		'entityStatuses',
		'invuln',
		'suggestions',
	]

	_badLifeSurges = 0
	_fifthGcd = false

	constructor(...args) {
		super(...args)
		this.addEventHook('cast', {by: 'player'}, this._onCast)
		this.addEventHook('complete', this._onComplete)
	}

	_pushToWindow(event, statusId, tracker) {
		if (this.combatants.selected.hasStatus(statusId)) {
			if (tracker.current === null) {
				// This can potentially happen if either LC or DS are used pre-pull
				tracker.current = {
					start: this.parser.fight.start_time,
					casts: [],
					isBad: false, // May want to flip this to true if prepull uses are actually a mistake
				}
			}

			tracker.current.casts.push(event)
		}
	}

	_onCast(event) {
		const action = getDataBy(ACTIONS, 'id', event.ability.guid)
		if (action && action.onGcd) {
			if (BAD_LIFE_SURGE_CONSUMERS.includes(action.id)) {
				this._fifthGcd = false // Reset the 4-5 combo hit flag on other GCDs
				if (this.combatants.selected.hasStatus(STATUSES.LIFE_SURGE.id)) {
					this._badLifeSurges++
				}
			} else if (FINAL_COMBO_HITS.includes(action.id)) {
				if (!this._fifthGcd) {
					// If we get 2 of these in a row (4-5 combo hits), only the first one is considered bad, so set a flag to ignore the next one
					this._fifthGcd = true
					if (this.combatants.selected.hasStatus(STATUSES.LIFE_SURGE.id)) {
						this._badLifeSurges++
					}
				}
			}
		}
	}

	_getDisembowelUptimePercent() {
		const statusUptime = this.entityStatuses.getStatusUptime(STATUSES.DISEMBOWEL.id, this.combatants.getEntities())
		const fightUptime = this.parser.currentDuration - this.invuln.getInvulnerableUptime()
		return (statusUptime / fightUptime) * 100
	}

	_onComplete() {
		this.checklist.add(new Rule({
			name: <Trans id="drg.buffs.checklist.name">Keep {ACTIONS.DISEMBOWEL.name} up</Trans>,
			description: <Trans id="drg.buffs.checklist.description">
				<ActionLink {...ACTIONS.DISEMBOWEL}/> provides a 10% boost to your personal damage and should always be kept up.
			</Trans>,
			displayOrder: DISPLAY_ORDER.DISEMBOWEL,
			requirements: [
				new Requirement({
					name: <Trans id="drg.buffs.checklist.requirement.name"><ActionLink {...ACTIONS.DISEMBOWEL}/> uptime</Trans>,
					percent: () => this._getDisembowelUptimePercent(),
				}),
			],
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.LIFE_SURGE.icon,
			content: <Trans id="drg.buffs.suggestions.life-surge.content">
				Avoid using <ActionLink {...ACTIONS.LIFE_SURGE}/> on any GCD that isn't <ActionLink {...ACTIONS.FULL_THRUST}/> or a 5th combo hit. Any other combo action will have significantly less potency, losing a lot of the benefit of the guaranteed crit.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				4: SEVERITY.MAJOR,
			},
			value: this._badLifeSurges,
			why: <Trans id="drg.buffs.suggestions.life-surge.why">
				You used {ACTIONS.LIFE_SURGE.name} on a non-optimal GCD <Plural value={this._badLifeSurges} one="# time" other="# times"/>.
			</Trans>,
		}))
	}
}
