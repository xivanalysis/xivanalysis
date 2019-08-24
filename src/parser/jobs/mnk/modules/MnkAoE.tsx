import {Plural, Trans} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'

import Module, {dependency} from 'parser/core/Module'
import {AoeEvent} from 'parser/core/modules/AoE'
import Combatants from 'parser/core/modules/Combatants'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'

// Assuming in correct forms
const AOE_ACTION_TARGETS = new Map<number, number>([
	// tslint:disable-next-line: no-magic-numbers
	[ACTIONS.ARM_OF_THE_DESTROYER.id, 3], // this is kinda also 4 but only under Leaden Fist
	[ACTIONS.FOUR_POINT_FURY.id, 2],
	[ACTIONS.ROCKBREAKER.id, 2],
	[ACTIONS.ENLIGHTENMENT.id, 2],
])

interface HundredPunchMeme extends AoeEvent {
	expectedHits: number
}

export default class MnkAoE extends Module {
	static handle = 'mnkaoe'

	@dependency private combatants!: Combatants
	@dependency private suggestions!: Suggestions

	private historyOfPunching: {[key: number]: HundredPunchMeme[]} = {
		[ACTIONS.ARM_OF_THE_DESTROYER.id]: [],
		[ACTIONS.FOUR_POINT_FURY.id]: [],
		[ACTIONS.ROCKBREAKER.id]: [],
		[ACTIONS.ENLIGHTENMENT.id]: [],
	}

	protected init(): void {
		this.addHook('aoedamage', {by: 'player', abilityId: Array.from(AOE_ACTION_TARGETS.keys())}, this.onDamage)
		this.addHook('complete', this.onComplete)
	}

	private onDamage(event: AoeEvent): void {
		const action = getDataBy(ACTIONS, 'id', event.ability.guid) as TODO

		if (!action) {
			return
		}

		const target = AOE_ACTION_TARGETS.get(action.id)

		if (target) {
			const aoeDamage = {...event, expectedHits: target}
			if (action.id === ACTIONS.ARM_OF_THE_DESTROYER.id && this.combatants.selected.hasStatus(STATUSES.LEADEN_FIST.id)) {
				aoeDamage.expectedHits++
			}

			this.historyOfPunching[action.id].push(aoeDamage)
		}
	}

	private onComplete(): void {
		Object.keys(this.historyOfPunching).forEach(key => {
			const action = getDataBy(ACTIONS, 'id', key) as TODO

			if (action) {
				this.suggestions.add(new TieredSuggestion({
					icon: action.icon,
					severity: SEVERITY.MEDIUM,
					content: <Trans id="mnk.aoe.suggestions.content">
						<ActionLink {...action}/> is only efficient when there are {AOE_ACTION_TARGETS.get(action.id)} or more targets.
					</Trans>,
					why: <Trans id="mnk.aoe.suggestions.rockbreaker.why">
						<ActionLink {...action}/> used on too few targets <Plural value={this.cleanPunchCount(action.id)} one="# time" other="# times" />.
					</Trans>,
				}))
			}
		})
	}

	private isCleanHit(event: HundredPunchMeme): boolean {
		return event.hits.length < event.expectedHits ? false : true
	}

	private cleanPunchCount(id: number): number {
		return this.historyOfPunching[id].filter(aoe => this.isCleanHit(aoe)).length
	}
}
